<script lang="ts">
	import { generateTitle } from '$lib/utils/generateTempTitle';
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import { newPromptBody, threads } from '$lib/stores/store.svelte';
	import { onMount } from 'svelte';
	import type { ChatMessage, ModelList, promptBody, Thread } from '$lib/types';
	import Markdown from 'svelte-exmarkdown';
	import { handleKeyDown } from '../../utils/sendMessageKeyboard';
	import { grow } from '../../utils/growTextbox';

	let slug = $derived(page.params.thread);
	let thread = $derived(threads.values.find((t) => t.id === slug));
	let messages = $derived(threads.values.find((t) => t.id === slug)?.messages ?? []);
	let inputValue = $state('');
	let currentModel: string = $state('Llama 3.1 8B');
	let isModelSelectionMenuOpen: boolean = $state(false);
	let isModelTypeSelectionMenuOpen: boolean = $state(false);
	let menuRef: HTMLDivElement | undefined = $state();
	let modelList: ModelList[] = $state([]);
	let modelType: 'direct' | 'socratic' = $state('direct');
	let messagesContainer: HTMLDivElement | undefined = $state();

	function toggleModelSelectionMenu() {
		isModelTypeSelectionMenuOpen = false;
		isModelSelectionMenuOpen = !isModelSelectionMenuOpen;
	}
	function toggleModelTypeSelectionMenu() {
		isModelSelectionMenuOpen = false;
		isModelTypeSelectionMenuOpen = !isModelTypeSelectionMenuOpen;
	}
	function changeModel(modelName: string) {
		currentModel = modelName;
		localStorage.setItem('CurrentModel', currentModel);
		isModelSelectionMenuOpen = false;
	}
	function handleClickOutside(event: MouseEvent) {
		// If menu is open and the click target is NOT the menu or its children
		if (isModelSelectionMenuOpen && menuRef && !menuRef.contains(event.target as Node)) {
			// We also check if the click was on the button that toggles it
			// to avoid double-toggling conflicts.
			const toggleButton = (event.target as HTMLElement).closest('.current-model button');
			if (!toggleButton) {
				isModelSelectionMenuOpen = false;
			}
		}
	}
	async function sendMessage() {
		if (!inputValue.trim() || !thread) return;

		const userMessage = {
			role: 'user' as const,
			content: inputValue,
			id: crypto.randomUUID()
		};
		thread.messages.push(userMessage);
		const promptToSend = inputValue;
		inputValue = '';

		const model = modelList.find((m) => m.modelName === currentModel);
		if (!model) return;
		const modelString = model.modelString;
		const provider = model.providerName;
		if (!provider || !modelString) return;

		try {
			await getResponseFromLLM({
				prompt: promptToSend,
				provider: provider,
				model: modelString,
				mode: modelType,
				history: thread.messages,
				conversationId: thread.id
			});
		} catch (error) {
			console.error('Error:', error);
		} finally {
			localStorage.setItem(`thread: ${JSON.stringify(thread.id)}`, JSON.stringify(thread));
		}
	}
	async function getModelList() {
		const response = await fetch('/', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await response.json();
		// console.log(result);
		if (result.status !== 200) {
			console.log('Error fetching model list');
		}
		modelList = result.data;
	}
	async function getResponseFromLLM(promptBody: promptBody) {
		try {
			const response = await fetch(`/chat/${slug}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ promptBody })
			});

			if (!response.body) return;
			const aiMessageId = crypto.randomUUID();
			const currentThread = threads.values.find((t) => t.id === slug);
			const aiMessage: ChatMessage = {
				role: 'assistant',
				content: '',
				id: aiMessageId
			};

			if (currentThread) {
				currentThread.messages.push(aiMessage);
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
							threads.values = threads.values.map((t) => {
								if (t.id !== slug) return t;

								return {
									...t,
									messages: t.messages.map((m) =>
										m.id === aiMessage.id ? { ...m, content: m.content + json.delta } : m
									)
								};
							});
						}

						if (json.type === 'done') {
							if (currentThread) currentThread.status = 'success';
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
			if (thread) thread.status = 'error';
		}
	}
	onMount(async () => {
		console.log(thread);

		getModelList();

		if (newPromptBody.value && !thread) {
			const initialPrompt = newPromptBody.value.prompt;
			if (!slug) {
				return;
			}
			const tempThread: Thread = {
				id: slug,
				title: generateTitle(initialPrompt),
				messages: [
					{
						role: 'user',
						content: initialPrompt,
						id: crypto.randomUUID()
					}
				],
				status: 'loading'
			};
			threads.values.push(tempThread);

			await getResponseFromLLM(newPromptBody.value);
			localStorage.setItem(`thread: ${JSON.stringify(tempThread.id)}`, JSON.stringify(thread));
			newPromptBody.value = null;

			const localModelType = localStorage.getItem('modelType');
			if (localModelType) {
				// @ts-expect-error the localModalType is set from the same type
				modelType = localModelType;
			} else {
				modelType = 'direct';
			}
		}

		const inputElement = document.getElementById('input-element') as HTMLInputElement;
		inputElement.focus();
		scrollToBottom(true);
	});
	$effect(() => {
		localStorage.setItem('modelType', modelType);
	});
	$effect(() => {
		scrollToBottom();
	});
	function scrollToBottom(instant: boolean = false) {
		if (messages.length && messagesContainer) {
			messagesContainer.scrollTo({
				top: messagesContainer.scrollHeight,
				behavior: instant ? 'smooth' : 'smooth'
			});
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	{#if thread}
		<title>{thread.title}</title>
	{:else if newPromptBody.value}
		<title>{generateTitle(newPromptBody.value.prompt)}</title>
	{:else}
		<title>{slug}</title>
	{/if}
</svelte:head>

<div class="thread-container flex h-full flex-col gap-2">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
		<!-- Thread Title -->
		<div class="flex items-center gap-4">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
				<Icon icon="lucide:sparkles" class="h-5 w-5 text-primary" />
			</div>
			<div>
				<h1 class="text-lg font-medium text-foreground">{thread?.title}</h1>
				<p class="text-sm text-muted-foreground">
					{currentModel} · {modelType[0].toUpperCase() + modelType.slice(1)}
				</p>
			</div>
		</div>

		<!-- Mode and Model Selector -->
		<div class="flex gap-2">
			<!-- Mode Selector -->
			<div class="relative">
				<button
					class="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm transition-colors hover:bg-secondary/80"
					onclick={() => {
						toggleModelTypeSelectionMenu();
					}}
				>
					{modelType[0].toUpperCase() + modelType.slice(1)}
					<Icon icon="lucide:chevron-down" class="h-3.5 w-3.5" />
				</button>

				{#if isModelTypeSelectionMenuOpen}
					<div
						class="absolute top-full right-0 z-40 mt-2 min-w-32 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
					>
						<button
							class={`w-full px-4 py-2.5 text-left text-sm transition-colors ${modelType == 'direct' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}
							onclick={() => {
								modelType = 'direct';
							}}>Direct</button
						>
						<button
							class={`w-full px-4 py-2.5 text-left text-sm transition-colors ${modelType == 'socratic' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}
							onclick={() => {
								modelType = 'socratic';
							}}>Socratic</button
						>
					</div>
				{/if}
			</div>

			<!-- Model Selector -->
			<div class="relative">
				<button
					class="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm transition-colors hover:bg-secondary/80"
					onclick={() => {
						toggleModelSelectionMenu();
					}}
				>
					{currentModel}
					<Icon icon="lucide:chevron-down" class="h-3.5 w-3.5" />
				</button>

				{#if isModelSelectionMenuOpen}
					<div
						class="absolute top-full right-0 z-40 mt-2 min-w-48 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
					>
						{#each modelList as model (model)}
							<button
								class={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
									currentModel == model.modelName
										? 'bg-primary text-primary-foreground'
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
	<div bind:this={messagesContainer} class="messages flex-1 space-y-6 overflow-y-auto px-6 py-8">
		{#if thread?.messages.length === 0}
			<div class="flex h-full flex-col items-center justify-center text-center">
				<Icon icon="lucide:sparkles" className="w-12 h-12 text-muted-foreground/20 mb-4" />
				<p class="text-muted-foreground/50">Start the conversation...</p>
			</div>
		{:else}
			{#each messages as message, index (message.id)}
				<div class="message animate-enter flex" style={`animation-delay: ${index * 30}ms; `}>
					<div
						class={`flex max-w-2xl gap-4 ${message.role === 'user' ? 'ml-auto flex-row-reverse' : 'flex-row'}`}
					>
						<!--Avatar  -->
						<div class="shrink-0">
							<div
								class={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-medium ${
									message.role === 'user'
										? 'bg-primary text-primary-foreground'
										: 'bg-secondary text-secondary-foreground'
								}`}
							>
								{message.role === 'user' ? 'You' : currentModel.split(' ')[0].slice(0, 3)}
							</div>
						</div>

						<!-- Content -->
						<div
							class={`flex flex-col gap-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
						>
							{#if message.role === 'assistant'}
								<p class="text-xs text-muted-foreground/60">{currentModel}</p>
							{/if}

							<div
								class={`message-content px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap ${
									message.role === 'user'
										? 'bg-primary/10 text-foreground'
										: 'bg-secondary/50 text-foreground'
								}`}
							>
								<Markdown md={message.content} />
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- Input -->
	<div class="input-field border-t border-border bg-card/30 px-6 py-5">
		<div class="flex items-center gap-3">
			<div class="flex-1">
				<textarea
					bind:value={inputValue}
					use:grow={{ value: inputValue }}
					onkeydown={(e) => handleKeyDown(e, sendMessage)}
					placeholder="Continue the conversation..."
					rows="1"
					class="w-full resize-none overflow-hidden border border-border bg-card px-4 py-3 text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none"
					id="input-element"
				></textarea>
			</div>
			<button
				disabled={!inputValue.trim()}
				class="shrink-0 bg-primary p-3 text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:border-primary-content/50 disabled:bg-primary/20 disabled:opacity-50"
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
			border-radius: 1rem;
		}
		button {
			border-radius: 1rem;
		}
	}
	.messages .message .message-content {
		border-radius: 1rem;
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
