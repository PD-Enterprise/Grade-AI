<script lang="ts">
	import IconPanelLeft from '~icons/lucide/panel-left';
	import IconSparkles from '~icons/ic/baseline-auto-awesome';
	import IconArrowUp from '~icons/ic/baseline-arrow-upward';
	import { page } from '$app/state';
	import {
		threads,
		currentModel,
		modelList,
		sidebarStatus,
		pageLoading
	} from '$lib/stores/store.svelte';
	import type { ChatMessage, Thread } from '$lib/types';
	import {
		createUserMessage,
		createAssistantMessage,
		addMessage,
		updateMessage,
		setThreadStatus,
		saveThread,
		loadThreadMessages,
		isResponseTimedOut,
		RESPONSE_TIMEOUT_MS
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
	let lastMessage = $derived(sortedMessages[sortedMessages.length - 1]);
	let inputValue = $state('');
	let messagesContainer: HTMLDivElement | undefined = $state();

	// Streaming
	let streamingContent = $state<string | null>(null);
	let streamingMessageId = $state<string | null>(null);
	let streamActivities = $state<string[]>([]);
	let streamWarnings = $state<string[]>([]);
	// Warnings (cut-off / context notices) kept per assistant message id
	let messageWarnings = $state<Record<string, string[]>>({});
	// Error feedback
	let failedMessageId = $state<string | null>(null);
	// Auto-send
	let pendingAutoSend = $state(false);
	// Scroll detection
	let isUserScrolledUp = $state(false);

	function getCurrentModel() {
		return modelList.values.find((m) => m.modelName === currentModel.value);
	}

	function pushActivity(text: string) {
		if (streamActivities[streamActivities.length - 1] === text) return;
		streamActivities = [...streamActivities, text].slice(-8);
	}

	function failStuckMessage(messageId: string) {
		failedMessageId = messageId;
		streamingContent = null;
		streamingMessageId = null;
		if (thread) {
			setThreadStatus(thread, 'error');
			threads.values = threads.values.map((t) =>
				t.id === thread?.id ? { ...t, status: 'error' as const } : t
			);
			const saved = threads.values.find((t) => t.id === slug);
			if (saved) saveThread(saved);
		}
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
					const serverWarning = m.warning ?? undefined;
					if (seen.has(m.clientUUID)) {
						const cached = messages.find((lm) => lm.id === m.clientUUID);
						if (cached && cached.warning !== serverWarning) {
							updateMessage(m.clientUUID, { warning: serverWarning });
							messages = messages.map((lm) =>
								lm.id === m.clientUUID ? { ...lm, warning: serverWarning } : lm
							);
						}
						continue;
					}
					const msg: ChatMessage = {
						id: m.clientUUID,
						conversationId: threadId,
						role: m.role,
						content: m.content,
						model: m.model,
						provider: m.provider,
						previousVersions: m.previousVersions,
						warning: serverWarning,
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
		failedMessageId = null;
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
		failedMessageId = null;
		streamActivities = [];
		streamWarnings = [];
		let receivedDone = false;
		setThreadStatus(thread, 'loading');
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort(new DOMException('Response timed out', 'AbortError'));
		}, RESPONSE_TIMEOUT_MS);
		try {
			const response = await fetch(`/chat/${slug}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				signal: controller.signal,
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
				clearTimeout(timeoutId);
				failedMessageId = aiMsg.id;
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

						if (json.type === 'thinking') {
							pushActivity('Thinking...');
						}

						if (json.type === 'tool' && json.tool) {
							const name = json.tool.name || 'tool';
							if (json.tool.status === 'completed') {
								pushActivity(`Done using tool: ${name}`);
							} else if (json.tool.status === 'failed') {
								pushActivity(`Tool failed: ${name}`);
							} else {
								pushActivity(`Using tool: ${name}...`);
							}
						}

						if (json.type === 'done') {
							receivedDone = true;
							const latestWarning =
								streamWarnings.length > 0 ? streamWarnings[streamWarnings.length - 1] : undefined;
							updateMessage(aiMsg.id, {
								content: streamingContent || '',
								warning: latestWarning
							});
							messages = messages.map((m) =>
								m.id === aiMsg.id
									? { ...m, content: streamingContent || '', warning: latestWarning }
									: m
							);
							messageWarnings = { ...messageWarnings, [aiMsg.id]: [...streamWarnings] };
							streamingContent = null;
							streamingMessageId = null;
							threads.values = threads.values.map((t) => {
								if (t.id !== slug) return t;
								return { ...t, status: 'success' as const };
							});
						}

						if (json.type === 'warning' && json.message) {
							if (!streamWarnings.includes(json.message)) {
								streamWarnings = [...streamWarnings, json.message];
							}
						}

						if (json.type === 'error') {
							pushActivity('Something went wrong while answering.');
						}
					} catch (err) {
						console.error('JSON parse error:', err, line);
					}
				}
			}
		} catch (error) {
			console.error('Streaming Error:', error);
			failedMessageId = aiMsg.id;
			streamingContent = null;
			streamingMessageId = null;
			setThreadStatus(thread, 'error');
		} finally {
			clearTimeout(timeoutId);
		}

		if (!receivedDone) {
			failedMessageId = aiMsg.id;
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
		inputValue = '';
		failedMessageId = null;

		await streamResponse(userMsg, aiMsg, model);
	}

	async function resendMessage(message: ChatMessage, opts?: { useCurrentModel?: boolean }) {
		if (!thread || streamingContent !== null || message.role !== 'assistant') return;
		const index = sortedMessages.findIndex((m) => m.id === message.id);
		if (index < 1) return;
		const userMsg = sortedMessages[index - 1];
		if (userMsg.role !== 'user' || userMsg.content === '') return;

		const current = getCurrentModel();
		const model = opts?.useCurrentModel
			? current
				? { providerName: current.providerName, modelString: current.modelString }
				: null
			: {
					providerName: message.provider ?? current?.providerName ?? 'groq',
					modelString: message.model ?? current?.modelString ?? ''
				};
		if (!model?.modelString) return;

		failedMessageId = null;
		const previousVersions = [...(message.previousVersions ?? []), message.content];
		const retriedAt = Date.now();
		const { [message.id]: _droppedWarnings, ...restWarnings } = messageWarnings;
		messageWarnings = restWarnings;
		const updatedModel =
			opts?.useCurrentModel && model
				? { model: model.modelString, provider: model.providerName }
				: {};
		updateMessage(message.id, {
			content: '',
			previousVersions,
			timestamp: retriedAt,
			warning: undefined,
			...updatedModel
		});
		messages = messages.map((m) =>
			m.id === message.id
				? {
						...m,
						content: '',
						previousVersions,
						timestamp: retriedAt,
						warning: undefined,
						...updatedModel
					}
				: m
		);

		await streamResponse(
			userMsg,
			{ ...message, content: '', previousVersions, ...updatedModel },
			model
		);
	}

	async function tryAutoSend() {
		if (autoSent || !thread || messages.length === 0) return;
		const model = getCurrentModel();
		if (!model) return;

		const lastMsg = messages[messages.length - 1];

		if (lastMsg.role === 'assistant' && lastMsg.content === '') {
			if (isResponseTimedOut(lastMsg.timestamp)) {
				failStuckMessage(lastMsg.id);
				autoSent = true;
				return;
			}
			if (thread.status === 'error') {
				failedMessageId = lastMsg.id;
				autoSent = true;
				return;
			}
		}

		if (lastMsg.role === 'assistant' && lastMsg.content === '' && thread.status === 'idle') {
			const userMsg = messages[messages.length - 2];
			if (userMsg && userMsg.role === 'user' && userMsg.content !== '') {
				autoSent = true;
				failedMessageId = null;
				scrollToBottom(messages, messagesContainer, true);
				await streamResponse(userMsg, lastMsg, model);
				return;
			}
		}

		if (lastMsg.role === 'assistant' && lastMsg.content === '' && thread.status === 'loading') {
			const userMsg = messages[messages.length - 2];
			if (userMsg && userMsg.role === 'user' && userMsg.content !== '') {
				autoSent = true;
				failedMessageId = null;
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
			failedMessageId = null;
			autoSent = false;
			inputValue = '';

			const currentThread = threads.values.find((t) => t.id === currentSlug);

			await loadServerMessages(currentSlug, signal);

			if (currentThread?.status === 'idle') {
				await createThreadOnBackend(currentThread, signal);
			}

			if (signal.cancelled) return;

			const lastLoaded = messages[messages.length - 1];
			if (lastLoaded?.role === 'assistant' && lastLoaded.content === '') {
				if (currentThread?.status === 'error') {
					failedMessageId = lastLoaded.id;
					autoSent = true;
				} else if (
					currentThread?.status === 'loading' &&
					isResponseTimedOut(lastLoaded.timestamp)
				) {
					setThreadStatus(currentThread, 'error');
					threads.values = threads.values.map((t) =>
						t.id === currentThread.id ? { ...t, status: 'error' as const } : t
					);
					saveThread(currentThread);
					failedMessageId = lastLoaded.id;
					autoSent = true;
				}
			}

			if (!autoSent && currentThread) await autoResend(currentThread);

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

	// Flip a stuck empty assistant message to error once it exceeds the timeout,
	// even if no stream is running (e.g. tab left open, fetch hung without settling).
	$effect(() => {
		const last = messages[messages.length - 1];
		if (!last || last.role !== 'assistant' || last.content !== '') return;
		if (streamingContent !== null || streamingMessageId !== null) return;
		if (failedMessageId === last.id) return;
		const remaining = RESPONSE_TIMEOUT_MS - (Date.now() - last.timestamp);
		if (remaining <= 0) {
			failStuckMessage(last.id);
			return;
		}
		const id = setTimeout(() => {
			const current = messages[messages.length - 1];
			if (!current || current.id !== last.id || current.content !== '') return;
			if (streamingContent !== null || streamingMessageId !== null) return;
			failStuckMessage(last.id);
		}, remaining);
		return () => clearTimeout(id);
	});

	$effect(() => {
		void messages;
		void streamingContent;
		void streamActivities;
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

<div class="thread-container flex h-full flex-col overflow-hidden">
	<!-- Header -->
	<div class="absolute flex items-center rounded-br-3xl p-2 backdrop-blur-sm">
		{#if !sidebarStatus.value}
			<button
				onclick={() => (sidebarStatus.value = !sidebarStatus.value)}
				class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
				aria-label="Open sidebar"
			>
				<IconPanelLeft class="h-4 w-4" />
			</button>
		{/if}
		<ModelSelector align="right" />
	</div>

	<!-- Messages -->
	<div
		bind:this={messagesContainer}
		class="messages h-[90vh] overflow-y-auto px-[2vw] pt-11"
		onscroll={() => {
			if (!messagesContainer) return;
			const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
			isUserScrolledUp = scrollTop + clientHeight < scrollHeight - 50;
		}}
	>
		<div class="mx-auto max-w-4xl space-y-8">
			{#if messages.length === 0 && streamingContent === null}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<IconSparkles class="mb-4 h-12 w-12 text-muted-foreground/20" />
					<p class="text-muted-foreground/50">Start the conversation...</p>
				</div>
			{:else}
				{#each sortedMessages.filter((m) => m.id !== streamingMessageId) as message, index (message.id)}
					<Message
						{index}
						role={message.role}
						content={message.content}
						model={message.model}
						busy={streamingContent !== null}
						error={message.id === failedMessageId}
						warning={messageWarnings[message.id] ?? message.warning}
						onRetry={message.id === failedMessageId
							? () => resendMessage(message, { useCurrentModel: true })
							: undefined}
						onDismiss={message.id === failedMessageId
							? () => {
									failedMessageId = null;
								}
							: undefined}
						onResend={message.role === 'assistant' && message.id === lastMessage?.id
							? () => resendMessage(message)
							: undefined}
					/>
				{/each}
				{#if streamingContent !== null}
					<div class="animate-enter" style="animation-delay: 0ms">
						<Message
							index={sortedMessages.length}
							role="assistant"
							content={streamingContent}
							activity={streamActivities}
							warning={streamWarnings}
						/>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Input -->
	<div class="input-field p-2">
		<div class="mx-auto flex max-w-4xl flex-col gap-1.5">
			<div
				class="flex flex-col gap-1 rounded-2xl border border-border bg-card/80 p-1.5 shadow-lg shadow-black/20 backdrop-blur-md transition-colors focus-within:border-primary/50"
			>
				<textarea
					bind:value={inputValue}
					use:grow={{ value: inputValue }}
					onkeydown={(e) => handleKeyDown(e, sendMessage)}
					placeholder="Continue the conversation..."
					rows="1"
					class="max-h-[200px] min-h-[24px] w-full resize-none overflow-hidden border-none bg-transparent px-1 py-1 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:ring-0 focus:outline-none"
					id="input-element"
				></textarea>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-1.5"></div>
					<div class="flex items-center gap-1.5">
						{#if thread}
							<div class="relative flex rounded-full bg-secondary p-0.5">
								<div
									class="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-card-foreground/10 transition-all duration-300 ease-in-out"
									style="left: {thread.mode === 'direct' ? '2px' : 'calc(50%)'}"
								></div>
								<button
									class="relative z-10 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200"
									class:text-foreground={thread.mode === 'direct'}
									class:text-muted-foreground={thread.mode !== 'direct'}
									onclick={() => {
										if (thread) {
											thread.mode = 'direct';
											threads.values = threads.values.map((t) =>
												t.id === thread.id ? { ...t, mode: 'direct' } : t
											);
											saveThread(thread);
										}
									}}>Direct</button
								>
								<button
									class="relative z-10 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200"
									class:text-foreground={thread.mode === 'socratic'}
									class:text-muted-foreground={thread.mode !== 'socratic'}
									onclick={() => {
										if (thread) {
											thread.mode = 'socratic';
											threads.values = threads.values.map((t) =>
												t.id === thread.id ? { ...t, mode: 'socratic' } : t
											);
											saveThread(thread);
										}
									}}>Socratic</button
								>
							</div>
						{/if}
						<button
							onclick={sendMessage}
							disabled={!inputValue.trim() || streamingContent !== null}
							class="text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:bg-primary/20 disabled:opacity-50"
							aria-label="Send message"
						>
							<IconArrowUp class="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>
			<div class="text-center text-xs text-muted-foreground/60">
				Press Enter to send, Shift + Enter for new line
			</div>
		</div>
	</div>
</div>

<style>
	.input-field {
		textarea {
			-ms-overflow-style: none;
			scrollbar-width: none;
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
