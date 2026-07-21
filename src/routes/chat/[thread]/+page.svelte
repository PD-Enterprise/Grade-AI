<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import { threads, currentModel, modelList, sidebarStatus, pageLoading } from '$lib/stores/store.svelte';
	import type { ChatMessage, Thread } from '$lib/types';
	import {
		createUserMessage,
		createAssistantMessage,
		addMessage,
		updateMessage,
		setThreadStatus,
		saveThread,
		loadThreadMessages
	} from '$lib/threads';
	import { onMount, untrack } from 'svelte';
	import { handleKeyDown } from '../../utils/sendMessageKeyboard';
	import { grow } from '../../utils/growTextbox';
	import Message from '../../components/message.svelte';
	import ModelSelector from '../../components/ModelSelector.svelte';
	import { scrollToBottom } from '$lib/utils/scrollToBottom';

	let slug = $derived(page.params.thread);
	let autoSent = $state(false);
	let thread = $derived(threads.values.find((t) => t.id === slug));
	let messages = $state<ChatMessage[]>([]);
	let sortedMessages = $derived([...messages].sort((a, b) => a.timestamp - b.timestamp));
	let inputValue = $state('');
	let messagesContainer: HTMLDivElement | undefined = $state();

	// Streaming
	let streamingContent = $state<string | null>(null);
	let streamingMessageId = $state<string | null>(null);

	// Error feedback
	let streamError = $state<string | null>(null);
	let lastPrompt = $state('');
	let pendingAutoSend = $state(false);
	// Scroll detection
	let isUserScrolledUp = $state(false);

	function getCurrentModel() {
		return modelList.values.find((m) => m.modelName === currentModel.value);
	}

	async function loadServerMessages(threadId: string, signal: { cancelled: boolean }) {
		try {
			const res = await fetch(`/api/messages/${threadId}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await res.json();
			if (signal.cancelled) return;
			if (result.status === 200 && Array.isArray(result.data?.messages)) {
				const seen = new Set(messages.map((m) => m.id));
				const local: ChatMessage[] = [];
				for (const m of result.data.messages) {
					if (seen.has(m.clientUUID)) continue;
					const msg: ChatMessage = {
						id: m.clientUUID,
						conversationId: threadId,
						role: m.role,
						content: m.content,
						model: m.model,
						provider: m.provider,
						timestamp: m.createdAt
					};
					local.push(msg);
					addMessage(msg);
				}
				if (local.length > 0) {
					messages = [...messages, ...local].sort((a, b) => a.timestamp - b.timestamp);
				}
			}
		} catch (e) {
			if (!signal.cancelled) console.error('Failed to load messages from backend:', e);
		}
	}

	async function createThreadOnBackend(thread: Thread, signal: { cancelled: boolean }) {
		const firstUserMsg = messages.find((m) => m.role === 'user');
		try {
			const response = await fetch('/api/thread', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: thread.id,
					title: thread.title,
					prompt: firstUserMsg?.content || ''
				})
			});
			const result = await response.json();
			if (signal.cancelled) return;
			if (result.status === 200) {
				thread.title = result.data.title;
				saveThread(thread);
				threads.values = threads.values.map((t) =>
					t.id === thread.id ? { ...t, title: result.data.title } : t
				);
			}
		} catch (e) {
			if (!signal.cancelled) console.error('Failed to create thread on backend:', e);
		}
	}

	async function autoResend(thread: Thread) {
		if (messages.length === 0) return;
		const lastMsg = messages[messages.length - 1];
		if (lastMsg.role !== 'assistant' || lastMsg.content !== '' || thread.status !== 'idle') return;
		const userMsg = messages[messages.length - 2];
		if (!userMsg || userMsg.role !== 'user' || userMsg.content === '') return;
		const model = modelList.values.find((m) => m.modelName === currentModel.value);
		if (!model) return;
		autoSent = true;
		lastPrompt = userMsg.content;
		streamError = null;
		scrollToBottom(messages, messagesContainer, true);
		streamResponse(userMsg, lastMsg, model);
	}

	async function streamResponse(
		userMsg: ChatMessage,
		aiMsg: ChatMessage,
		model: { providerName: string; modelString: string }
	) {
		if (!thread) return;

		streamingContent = '';
		streamingMessageId = aiMsg.id;
		setThreadStatus(thread, 'loading');

		try {
			const response = await fetch(`/chat/${slug}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt: userMsg.content,
					provider: model.providerName,
					model: model.modelString,
					mode: thread.mode,
					conversationId: thread.id,
					messageClientId: userMsg.id,
					assistantClientId: aiMsg.id
				})
			});

			if (!response.body) {
				streamError = 'No response from server';
				streamingContent = null;
				streamingMessageId = null;
				setThreadStatus(thread, 'error');
				saveThread(thread);
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.trim()) continue;

					try {
						const json = JSON.parse(line);

						if (json.type == 'delta' && json.delta) {
							streamingContent += json.delta;
						}

						if (json.type === 'done') {
							updateMessage(aiMsg.id, { content: streamingContent || '' });
							messages = messages.map((m) =>
								m.id === aiMsg.id ? { ...m, content: streamingContent || '' } : m
							);
							streamingContent = null;
							streamingMessageId = null;
							threads.values = threads.values.map((t) => {
								if (t.id !== slug) return t;
								return { ...t, status: 'success' as const };
							});
						}

						if (json.type === 'error') {
							streamError = json.message || 'An error occurred';
							streamingContent = null;
							streamingMessageId = null;
							setThreadStatus(thread, 'error');
						}
					} catch (err) {
						console.error('JSON parse error:', err, line);
					}
				}
			}
		} catch (error) {
			console.error('Streaming Error:', error);
			streamError = 'Connection lost. Check your network and try again.';
			streamingContent = null;
			streamingMessageId = null;
			setThreadStatus(thread, 'error');
		}

		const saved = threads.values.find((t) => t.id === slug);
		if (saved) saveThread(saved);
	}

	async function sendMessage() {
		if (!inputValue.trim() || !thread) return;

		const promptToSend = inputValue;
		const model = getCurrentModel();
		if (!model) return;

		const userMsg = createUserMessage(
			thread.id,
			promptToSend,
			model.modelString,
			model.providerName
		);
		const aiMsg = createAssistantMessage(thread.id, model.modelString, model.providerName);
		addMessage(userMsg);
		addMessage(aiMsg);
		messages = [...messages, userMsg, aiMsg];
		lastPrompt = promptToSend;
		inputValue = '';
		streamError = null;

		await streamResponse(userMsg, aiMsg, model);
	}

	function retryLastMessage() {
		if (!lastPrompt || !thread) return;
		inputValue = lastPrompt;
		if (streamingMessageId) {
			messages = messages.filter((m) => m.id !== streamingMessageId);
		}
		streamError = null;
		streamingContent = null;
		streamingMessageId = null;
		sendMessage();
	}

	async function tryAutoSend() {
		if (autoSent || !thread || messages.length === 0) return;
		const model = getCurrentModel();
		if (!model) return;

		const lastMsg = messages[messages.length - 1];

		if (lastMsg.role === 'assistant' && lastMsg.content === '' && thread.status === 'idle') {
			const userMsg = messages[messages.length - 2];
			if (userMsg && userMsg.role === 'user' && userMsg.content !== '') {
				autoSent = true;
				lastPrompt = userMsg.content;
				streamError = null;
				scrollToBottom(messages, messagesContainer, true);
				await streamResponse(userMsg, lastMsg, model);
				return;
			}
		}

		if (
			lastMsg.role === 'assistant' &&
			lastMsg.content === '' &&
			(thread.status === 'loading' || thread.status === 'error')
		) {
			const userMsg = messages[messages.length - 2];
			if (userMsg && userMsg.role === 'user' && userMsg.content !== '') {
				autoSent = true;
				streamError = null;
				streamingContent = null;
				streamingMessageId = null;
				await streamResponse(userMsg, lastMsg, model);
			}
		}
	}

	onMount(() => {
		const inputElement = document.getElementById('input-element') as HTMLInputElement;
		inputElement?.focus();
	});

	$effect(() => {
		const currentSlug = slug;
		if (!currentSlug) return;
		const signal = { cancelled: false };

		untrack(async () => {
			messages = loadThreadMessages(currentSlug);
			pageLoading.value = false;
			streamingContent = null;
			streamingMessageId = null;
			streamError = null;
			autoSent = false;
			lastPrompt = '';
			inputValue = '';

			const currentThread = threads.values.find((t) => t.id === currentSlug);

			await loadServerMessages(currentSlug, signal);

			if (currentThread?.status === 'idle') {
				await createThreadOnBackend(currentThread, signal);
			}

			if (signal.cancelled) return;

			if (currentThread) await autoResend(currentThread);

			if (!autoSent && modelList.values.length === 0) {
				pendingAutoSend = true;
			}
		});

		return () => {
			signal.cancelled = true;
		};
	});

	$effect(() => {
		if (modelList.values.length > 0 && pendingAutoSend) {
			pendingAutoSend = false;
			tryAutoSend();
		}
	});

	$effect(() => {
		void messages;
		void streamingContent;
		if (isUserScrolledUp) return;
		const id = setTimeout(() => {
			scrollToBottom(messages, messagesContainer);
		}, 10);
		return () => clearTimeout(id);
	});
</script>

<svelte:head>
	<title>{thread?.title ?? 'Chat'}</title>
</svelte:head>

<div class="thread-container flex h-full flex-col gap-2 overflow-hidden">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
		<div class="flex items-center gap-4">
			{#if !sidebarStatus.value}
				<button
					onclick={() => (sidebarStatus.value = !sidebarStatus.value)}
					class="opacity-60 transition-opacity hover:opacity-100"
					aria-label="Open sidebar"
				>
					<Icon icon="lucide:menu" class="h-5 w-5" />
				</button>
			{/if}
			<div>
				<h1 class="text-sm font-medium text-foreground sm:text-lg">{thread?.title ?? 'Chat'}</h1>
				{#if thread?.mode}
					<p class="text-sm text-muted-foreground">
						{thread.mode[0].toUpperCase() + thread.mode.slice(1)}
					</p>
				{/if}
			</div>
		</div>

		<ModelSelector />
	</div>

	<!-- Messages -->
	<div
		bind:this={messagesContainer}
		class="messages h-[90vh] flex-1 overflow-y-auto px-6 py-8"
		onscroll={() => {
			if (!messagesContainer) return;
			const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
			isUserScrolledUp = scrollTop + clientHeight < scrollHeight - 50;
		}}
	>
		<div class="mx-auto max-w-4xl space-y-8">
			{#if messages.length === 0 && streamingContent === null}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<Icon icon="lucide:sparkles" className="w-12 h-12 text-muted-foreground/20 mb-4" />
					<p class="text-muted-foreground/50">Start the conversation...</p>
				</div>
			{:else}
				{#each sortedMessages.filter((m) => m.id !== streamingMessageId) as message, index (message.id)}
					<Message {index} role={message.role} content={message.content} model={message.model} />
				{/each}
				{#if streamingContent !== null}
					<div class="animate-enter" style="animation-delay: 0ms">
						<Message index={sortedMessages.length} role="assistant" content={streamingContent} />
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Error Banner -->
	{#if streamError}
		<div
			class="mx-4 mb-2 flex items-center gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
		>
			<Icon icon="lucide:alert-circle" class="h-4 w-4 shrink-0" />
			<span class="flex-1">{streamError}</span>
			<button
				onclick={retryLastMessage}
				class="shrink-0 rounded-md bg-error/20 px-3 py-1 font-medium transition-colors hover:bg-error/30"
			>
				Retry
			</button>
			<button
				onclick={() => {
					streamError = null;
				}}
				class="shrink-0 rounded-md p-1 transition-colors hover:bg-error/20"
			>
				<Icon icon="lucide:x" class="h-3.5 w-3.5" />
			</button>
		</div>
	{/if}

	<!-- Input -->
	<div class="input-field border-t border-border bg-card/30 px-4 py-4">
		<div class="flex items-center gap-3">
			<div class="flex-1">
				<textarea
					bind:value={inputValue}
					use:grow={{ value: inputValue }}
					onkeydown={(e) => handleKeyDown(e, sendMessage)}
					placeholder="Continue the conversation..."
					rows="1"
					class="w-full resize-none overflow-hidden border border-border bg-card px-4 py-4 text-base text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none"
					id="input-element"
				></textarea>
			</div>
			<button
				onclick={sendMessage}
				disabled={!inputValue.trim() || streamingContent !== null}
				class="text-primary-foreground flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[1.25rem] bg-primary p-0 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:border-primary-content/50 disabled:bg-primary/20 disabled:opacity-50"
			>
				<Icon icon="lucide:arrow-right" class="h-4 w-4" />
			</button>
		</div>
	</div>
</div>

<style>
	.input-field {
		textarea {
			-ms-overflow-style: none;
			scrollbar-width: none;
			border-radius: 1.5rem;
			min-height: 60px;
		}
	}
	.animate-enter {
		animation: enter 0.3s ease-out forwards;
	}
	@keyframes enter {
		from {
			opacity: 0;
			transform: scale(0.98);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
