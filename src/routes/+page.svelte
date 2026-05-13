<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import type { promptBody } from '$lib/types';
	import { newPromptBody, currentModel, modelType, modelList } from '$lib/stores/store.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { handleKeyDown } from './utils/sendMessageKeyboard';
	import { grow } from './utils/growTextbox';

	let isModelSelectionMenuOpen: boolean = $state(false);
	let menuRef: HTMLDivElement | undefined = $state();
	let prompt: string = $state('');
	let mounted: boolean = $state(false);

	function changeModel(modelName: string) {
		currentModel.value = modelName;
		localStorage.setItem('CurrentModel', currentModel.value);
		isModelSelectionMenuOpen = false;
	}
	function toggleModelSelectionMenu() {
		isModelSelectionMenuOpen = !isModelSelectionMenuOpen;
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
		if (!prompt.trim()) return;

		const model = modelList.values.find((m) => m.modelName === currentModel.value);
		if (!model) return;

		const threadId = crypto.randomUUID();
		const promptBody: promptBody = {
			prompt: prompt,
			provider: model.providerName,
			model: model.modelString,
			mode: modelType.value,
			history: [],
			conversationId: threadId
		};

		newPromptBody.value = promptBody;
		goto(resolve(`/chat/${threadId}`));
	}
	async function getModelListFromApi() {
		const response = await fetch('/', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await response.json();
		// console.log(result);
		if (result.status !== 200) {
			console.log('Error fetching model list');
		}
		modelList.values = result.data;
	}
	onMount(async () => {
		mounted = true;

		await getModelListFromApi();
		// console.log(modelList);

		const localCurrentModel = localStorage.getItem('CurrentModel');
		const localModelType = localStorage.getItem('modelType');
		if (localCurrentModel) {
			changeModel(localCurrentModel);
		} else if (modelList.values.length > 0) {
			changeModel(modelList.values[0].modelName);
		}
		if (localModelType) {
			// @ts-expect-error the localModalType is set from the same type
			modelType.value = localModelType;
		} else {
			modelType.value = 'direct';
		}

		const inputElement = document.getElementById('input-element') as HTMLInputElement;
		inputElement.focus();
	});
	$effect(() => {
		localStorage.setItem('modelType', modelType.value);
	});
</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	<title>Grade AI</title>
</svelte:head>

<div class="flex flex-1 flex-col items-center justify-center bg-background px-4 py-20">
	<div class="w-full max-w-2xl">
		<!-- Logo and Title -->
		<div
			class={`logo-and-title mb-12 text-center transition-all duration-700  ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
		>
			<div class="mb-4 flex items-center justify-center gap-2">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<Icon icon="lucide:sparkles" class="h-5 w-5 text-primary" />
				</div>
			</div>
			<h1 class="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Grade AI</h1>
			<p class="mt-3 text-muted-foreground">Learn smarter with intelligent dialogue</p>
		</div>

		<!-- Input -->
		<div
			class={`relative z-10 transition-all delay-100 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
		>
			<!-- Input Field -->
			<div class="relative flex items-center">
				<textarea
					bind:value={prompt}
					use:grow={{ value: prompt }}
					onkeydown={(e) => handleKeyDown(e, sendMessage)}
					placeholder="Ask anything..."
					rows="1"
					class="w-full resize-none overflow-y-auto rounded-xl border border-border bg-card px-5 py-4 pr-14 text-foreground transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none"
					id="input-element"
				></textarea>
				<button
					disabled={!prompt.trim()}
					class="absolute right-2 rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:bg-primary/20"
					onclick={sendMessage}
					id="send-message-button"
				>
					<Icon icon="lucide:arrow-right" class="h-4 w-4" />
				</button>
			</div>

			<!-- Mode and Model Selector -->
			<div class="mt-4 flex items-center justify-center gap-2">
				<!-- Mode Selector -->
				<div class="flex rounded-lg bg-secondary p-1">
					<button
						class={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${modelType.value == 'direct' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
						onclick={() => {
							modelType.value = 'direct';
						}}>Direct Model</button
					>
					<button
						class={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${modelType.value == 'socratic' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
						onclick={() => {
							modelType.value = 'socratic';
						}}>Socratic Models</button
					>
				</div>

				<!-- Model Selector -->
				<div class="relative">
					<button
						class="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
						onclick={() => {
							toggleModelSelectionMenu();
						}}
					>
						{currentModel.value}
						<Icon icon="lucide:chevron-down" class="h-3 w-3" />
					</button>

					{#if isModelSelectionMenuOpen}
						<div
							class="absolute top-full right-0 z-40 mt-2 min-w-40 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
						>
							{#each modelList.values as model (model)}
								<button
									class={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
										currentModel.value == model.modelName
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

		<!-- Features -->
		<div
			class={`mt-16 grid grid-cols-2 gap-4 transition-all delay-200 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
		>
			<div class="rounded-xl border border-border/50 bg-card/50 p-4">
				<Icon icon="lucide:zap" class="mb-2 h-5 w-5 text-primary" />
				<div class="text-sm font-medium">Direct Answers</div>
				<div class="mt-1 text-xs text-muted-foreground">Get instant responses from AI models</div>
			</div>
			<div class="rounded-xl border border-border/50 bg-card/50 p-4">
				<Icon icon="lucide:sparkles" class="mb-2 h-5 w-5 text-primary" />
				<div class="text-sm font-medium">Socratic Learning</div>
				<div class="mt-1 text-xs text-muted-foreground">Learn through guided questions</div>
			</div>
		</div>
	</div>
</div>

<style>
	textarea {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
