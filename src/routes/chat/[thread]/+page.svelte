<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import {
		threads,
		currentModel,
		modelList
	} from '$lib/stores/store.svelte';
	import { createUserMessage, createAssistantMessage, addMessage, setThreadStatus, saveThread } from '$lib/threads';
	import { onMount } from 'svelte';
	import { handleKeyDown } from '../../utils/sendMessageKeyboard';
	import { grow } from '../../utils/growTextbox';
	import Message from '../../components/message.svelte';


	let slug = $derived(page.params.thread);
	let thread = $derived(threads.values.find((t) => t.id === slug));
	let messages = $derived(thread?.messages ?? []);
	let lastAssistantId = $derived(
		thread?.status === 'loading'
			? [...messages].reverse().find((m) => m.role === 'assistant')?.id ?? null
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

		const userMsg = createUserMessage(promptToSend, model.modelString, model.providerName);
		addMessage(thread, userMsg);
		inputValue = '';

		const aiMsg = createAssistantMessage();
		addMessage(thread, aiMsg);
		setThreadStatus(thread, 'loading');

		const history = thread.messages.slice(0, -1);

		try {
			const response = await fetch(`/chat/${slug}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					promptBody: {
						prompt: promptToSend,
						provider: model.providerName,
						model: model.modelString,
						mode: thread.mode,
						history: history,
						conversationId: thread.id
					}
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
							threads.values = threads.values.map((t) => {
								if (t.id !== slug) return t;
								return {
									...t,
									messages: t.messages.map((m) =>
										m.id === aiMsg.id ? { ...m, content: m.content + json.delta } : m
									)
								};
							});
						}

						if (json.type === 'done') {
							threads.values = threads.values.map((t) => {
								if (t.id !== slug) return t;
								return { ...t, status: 'success' as const };
							});
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

	onMount(() => {
		const inputElement = document.getElementById('input-element') as HTMLInputElement;
		inputElement?.focus();
		scrollToBottom(true);
	});

	$effect(() => {
		scrollToBottom();
	});

	function scrollToBottom(instant: boolean = false) {
		if (messages.length && messagesContainer) {
			messagesContainer.scrollTo({
				top: messagesContainer.scrollHeight,
				behavior: instant ? 'instant' : 'smooth'
			});
		}
	}
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
				<p class="text-sm text-muted-foreground">
					{currentModel.value || 'No model selected'}
					{#if thread?.mode}
						· {thread.mode[0].toUpperCase() + thread.mode.slice(1)}
					{/if}
				</p>
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
			{#if thread?.messages.length === 0}
				<div class="flex h-full flex-col items-center justify-center text-center">
					<Icon icon="lucide:sparkles" className="w-12 h-12 text-muted-foreground/20 mb-4" />
					<p class="text-muted-foreground/50">Start the conversation...</p>
				</div>
			{:else}
				{#each messages as message, index (message.id)}
					<Message {index} role={message.role} content={message.content} loading={message.id === lastAssistantId} />
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
