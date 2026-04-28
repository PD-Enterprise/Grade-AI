<script lang="ts">
	import { generateTitle } from '$lib/utils/generateTempTitle';
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import { isAuthenticated, newPromptBody, threads } from '$lib/stores/store.svelte';
	import { onMount } from 'svelte';
	import type { ChatMessage, ModelList, promptBody, Thread } from '$lib/types';
	import Markdown from 'svelte-exmarkdown';

	let slug = $derived(page.params.thread);
	let thread = $derived(threads.values.find((t) => t.id === slug));
	let messages = $derived(threads.values.find((t) => t.id === slug)?.messages ?? []);
	let inputValue = $state('');
	let currentModel: string = $state('Llama 3.1 8B');
	let isModelSelectionMenuOpen: boolean = $state(false);
	let menuRef: HTMLDivElement | undefined = $state();
	let modelList: ModelList[] = $state([]);
	let modelType: 'direct' | 'socratic' = $state('direct');
	let sendButton: HTMLButtonElement | undefined = $state();

	function toggleModelSelectionMenu() {
		isModelSelectionMenuOpen = !isModelSelectionMenuOpen;
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
		sendButton = document.getElementById('send-message-button') as HTMLButtonElement;

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
	});
	$effect(() => {
		if (sendButton) {
			if (!isAuthenticated.value) {
				sendButton.disabled = true;
			} else {
				if (inputValue == '') {
					sendButton.disabled = true;
				} else {
					sendButton.disabled = false;
				}
			}
		}
		localStorage.setItem('modelType', modelType);
	});
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
	<header class="thread-header absolute z-1 mt-2 ml-2 rounded-xl p-3 backdrop-blur-lg">
		<h2 class="font-bold">Thread {slug}</h2>
	</header>

	<div class="chat-container over flex flex-1 flex-col-reverse gap-2 overflow-y-scroll p-2">
		<!-- {#each messages.toReversed() as message (message.id)}
			{#if message.role === 'user'}
				<div class="chat-end chat">
					<div class="chat-header">
						{message.role}
					</div>

					<div class="chat-bubble bg-base-300">{message.content}</div>
				</div>
			{:else}
				<div class="chat-start chat">
					<div class="chat-header">
						{message.role}
					</div>

					<div class="chat-bubble prose prose-sm bg-base-200">
						<Markdown md={message.content} />
					</div>
				</div>
			{/if}
		{/each} -->
	</div>

	<div class="input-group flex w-full flex-col gap-3 rounded-2xl rounded-b-none bg-base-200 p-3">
		<div class="input-field">
			<input
				type="text"
				placeholder="Enter your question here"
				class="input w-full rounded border-none bg-transparent p-0 focus:outline-none"
				bind:value={inputValue}
				onkeydown={(e) => e.key === 'Enter' && sendMessage()}
				id="input-element"
			/>
		</div>

		<div class="action-bar flex h-10 flex-row justify-between gap-3 bg-base-200">
			<div class="current-model">
				<button
					class="bg-ghost btn rounded p-2 hover:bg-base-100"
					onclick={() => {
						toggleModelSelectionMenu();
					}}
				>
					{currentModel}
				</button>
				{#if isModelSelectionMenuOpen}
					<div
						bind:this={menuRef}
						class="model-selection relative bottom-60 left-26 flex flex-col gap-2 rounded-xl bg-base-300 p-2"
						id="model-selection-menu"
					>
						<div class="model-type flex flex-row gap-2">
							<button
								class={`direct-models btn rounded underline ${modelType == 'direct' ? '' : 'btn-ghost'} hover:bg-base-100`}
								onclick={() => {
									modelType = 'direct';
								}}>Direct Model</button
							>
							<button
								class={`socratic-models btn rounded underline ${modelType != 'direct' ? '' : 'btn-ghost'} hover:bg-base-100`}
								onclick={() => {
									modelType = 'socratic';
								}}>Socratic Models</button
							>
						</div>
						<div class="model-list flex flex-col gap-2">
							{#each modelList as model (model)}
								{#if model.modelString == currentModel}
									<button
										class="btn justify-start rounded p-2"
										onclick={() => {
											changeModel(model.modelName);
										}}
									>
										{model.modelName}
									</button>
								{:else}
									<button
										class="btn justify-start rounded p-2 btn-ghost"
										onclick={() => {
											changeModel(model.modelName);
										}}
									>
										{model.modelName}
									</button>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<button
				class="btn rounded bg-transparent hover:bg-base-100"
				onclick={sendMessage}
				id="send-message-button"><Icon icon="ic:round-send" width="24" height="24" /></button
			>
		</div>
	</div>
</div>
