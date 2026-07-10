<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import { threads, currentModel, modelList } from '$lib/stores/store.svelte';
	import type { ChatMessage } from '$lib/types';
	import {
		createUserMessage,
		createAssistantMessage,
		addMessage,
		setThreadStatus,
		saveThread,
		removeMessage,
		loadThreadMessages,
		updateMessage
	} from '$lib/threads';
	import { onMount } from 'svelte';
	import { handleKeyDown } from '../../utils/sendMessageKeyboard';
	import { grow } from '../../utils/growTextbox';
	import Message from '../../components/message.svelte';
	import { scrollToBottom } from '$lib/utils/scrollToBottom';

	let slug = $derived(page.params.thread);
	let autoSent = $state(false);
	let thread = $derived(threads.values.find((t) => t.id === slug));
	let messages = $state<ChatMessage[]>([]);
	let sortedMessages = $derived([...messages].sort((a, b) => a.timestamp - b.timestamp));
	let lastAssistantId = $derived(
		thread?.status === 'loading'
			? ([...sortedMessages].reverse().find((m) => m.role === 'assistant')?.id ?? null)
			: null
	);
	let inputValue = $state('');
	let isModelSelectionMenuOpen: boolean = $state(false);
	let menuRef: HTMLDivElement | undefined = $state();
	let messagesContainer: HTMLDivElement | undefined = $state();

	function toggleModelSelectionMenu() {
		isModelSelectionMenuOpen = !isModelSelectionMenuOpen;
	}
	function changeModel(modelName: string) {
		currentModel.value = modelName;
		isModelSelectionMenuOpen = false;
	}
	function handleClickOutside(event: MouseEvent) {
		if (isModelSelectionMenuOpen && menuRef && !menuRef.contains(event.target as Node)) {
			const toggleButton = (event.target as HTMLElement).closest('.current-model button');
			if (!toggleButton) {
				isModelSelectionMenuOpen = false;
			}
		}
	}

	function getCurrentModel() {
		return modelList.values.find((m) => m.modelName === currentModel.value);
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
		addMessage(userMsg);
		messages = [...messages, userMsg];
		inputValue = '';

		const aiMsg = createAssistantMessage(thread.id, model.modelString, model.providerName);
		addMessage(aiMsg);
		messages = [...messages, aiMsg];
		setThreadStatus(thread, 'loading');

		try {
			const response = await fetch(`/chat/${slug}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt: promptToSend,
					provider: model.providerName,
					model: model.modelString,
					mode: thread.mode,
					conversationId: thread.id,
					messageClientId: userMsg.id,
					assistantClientId: aiMsg.id
				})
			});

			if (!response.body) return;

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
							messages = messages.map((m) =>
								m.id === aiMsg.id ? { ...m, content: m.content + json.delta } : m
							);
						}

						if (json.type === 'done') {
							threads.values = threads.values.map((t) => {
								if (t.id !== slug) return t;
								return { ...t, status: 'success' as const };
							});
							const finalMsg = messages.find((m) => m.id === aiMsg.id);
							if (finalMsg) updateMessage(finalMsg.id, { content: finalMsg.content });
						}

						if (json.type === 'error') {
							console.error(json.message);
						}
					} catch (err) {
						console.error('JSON parse error:', err, line);
					}
				}
			}
		} catch (error) {
			console.error('Streaming Error:', error);
			threads.values = threads.values.map((t) => {
				if (t.id !== slug) return t;
				return { ...t, status: 'error' as const };
			});
		}

		const saved = threads.values.find((t) => t.id === slug);
		if (saved) saveThread(saved);
	}

	function tryAutoSend() {
		if (autoSent) return;
		if (!thread || messages.length === 0) return;
		const lastMsg = messages[messages.length - 1];
		if (lastMsg.role !== 'user' || thread.status !== 'idle') return;
		const model = getCurrentModel();
		if (!model) return;

		autoSent = true;
		removeMessage(lastMsg.id);
		messages = messages.slice(0, -1);
		inputValue = lastMsg.content;
		sendMessage();
	}

	onMount(() => {
		if (slug) {
			messages = loadThreadMessages(slug);

			fetch(`/api/messages/${slug}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			})
				.then((res) => res.json())
				.then((result) => {
					if (result.status === 200 && Array.isArray(result.data?.messages)) {
						const seen = new Set(messages.map((m) => m.id));
						const local: ChatMessage[] = [];
						for (const m of result.data.messages) {
							if (seen.has(m.clientUUID)) continue;
							const msg: ChatMessage = {
								id: m.clientUUID,
								conversationId: slug,
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
				})
				.catch((e) => console.error('Failed to load messages from backend:', e));
		}

		const inputElement = document.getElementById('input-element') as HTMLInputElement;
		inputElement?.focus();
		scrollToBottom(messages, messagesContainer, true);

		if (thread && thread.status === 'idle') {
			fetch('/api/thread', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: thread.id, title: thread.title })
			}).catch((e) => console.error('Failed to create thread on backend:', e));
		}

		tryAutoSend();
	});

	$effect(() => {
		if (modelList.values.length > 0) {
			tryAutoSend();
		}
	});

	$effect(() => {
		scrollToBottom(messages, messagesContainer);
	});
</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	<title>{thread?.title ?? 'Chat'}</title>
</svelte:head>

<div class="thread-container flex h-full flex-col gap-2">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
		<div class="flex items-center gap-4">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
				<Icon icon="lucide:sparkles" class="h-5 w-5 text-primary" />
			</div>
			<div>
				<h1 class="text-lg font-medium text-foreground">{thread?.title ?? 'Chat'}</h1>
				{#if thread?.mode}
					<p class="text-sm text-muted-foreground">
						{thread.mode[0].toUpperCase() + thread.mode.slice(1)}
					</p>
				{/if}
			</div>
		</div>

		<div class="flex gap-2">
			<div class="relative">
				<button
					class="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm transition-colors hover:bg-secondary/80"
					onclick={() => {
						toggleModelSelectionMenu();
					}}
				>
					{currentModel.value}
					<Icon icon="lucide:chevron-down" class="h-3.5 w-3.5" />
				</button>

				{#if isModelSelectionMenuOpen}
					<div
						class="absolute top-full right-0 z-40 mt-2 min-w-48 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
					>
						{#each modelList.values as model (model)}
							<button
								class={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
									currentModel.value == model.modelName
										? 'text-primary-foreground bg-primary'
										: 'text-foreground hover:bg-secondary'
								}`}
								onclick={() => {
									changeModel(model.modelName);
								}}
							>
								{model.modelName}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Messages -->
	<div bind:this={messagesContainer} class="messages flex-1 overflow-y-auto px-6 py-8">
		<div class="mx-auto max-w-4xl space-y-8">
			{#if messages.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<Icon icon="lucide:sparkles" className="w-12 h-12 text-muted-foreground/20 mb-4" />
					<p class="text-muted-foreground/50">Start the conversation...</p>
				</div>
			{:else}
				{#each sortedMessages as message, index (message.id)}
					<Message
						{index}
						role={message.role}
						content={message.content}
						model={message.model}
						loading={message.id === lastAssistantId}
					/>
				{/each}
			{/if}
		</div>
	</div>

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
					class="w-full resize-none overflow-hidden border border-border bg-card px-4 py-4 text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none"
					id="input-element"
				></textarea>
			</div>
			<button
				onclick={sendMessage}
				disabled={!inputValue.trim()}
				class="text-primary-foreground shrink-0 bg-primary p-3 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:border-primary-content/50 disabled:bg-primary/20 disabled:opacity-50"
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
		button {
			border-radius: 1rem;
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
