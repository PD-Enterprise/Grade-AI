<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import {
		currentModel,
		defaultMode,
		modelList,
		modelsLoading,
		userData,
		isAuthenticated,
		threads
	} from '$lib/stores/store.svelte';
	import {
		createThread,
		createUserMessage,
		createAssistantMessage,
		addMessage,
		saveThread
	} from '$lib/threads';
	import { generateTitle } from '$lib/utils/generateTempTitle';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { handleKeyDown } from './utils/sendMessageKeyboard';
	import { grow } from './utils/growTextbox';
	import Onboarding from './components/onboarding.svelte';

	let isModelSelectionMenuOpen: boolean = $state(false);
	let menuRef: HTMLDivElement | undefined = $state();
	let prompt: string = $state('');
	let mounted: boolean = $state(false);

	function changeModel(modelName: string) {
		currentModel.value = modelName;
		isModelSelectionMenuOpen = false;
	}
	function toggleModelSelectionMenu() {
		isModelSelectionMenuOpen = !isModelSelectionMenuOpen;
	}
	function handleClickOutside(event: MouseEvent) {
		if (isModelSelectionMenuOpen && menuRef && !menuRef.contains(event.target as Node)) {
			const toggleButton = (event.target as HTMLElement).closest('.current-model button');
			if (!toggleButton) {
				isModelSelectionMenuOpen = false;
			}
		}
	}

	async function sendMessage() {
		if (!prompt.trim()) return;

		if (!currentModel.value && modelList.values.length > 0) {
			currentModel.value = modelList.values[0].modelName;
		}
		const model = modelList.values.find((m) => m.modelName === currentModel.value);
		if (!model) return;

		const threadId = crypto.randomUUID();
		const title = generateTitle(prompt);
		const thread = createThread(threadId, title, defaultMode.value);
		const userMsg = createUserMessage(threadId, prompt, model.modelString, model.providerName);
		const aiMsg = createAssistantMessage(threadId, model.modelString, model.providerName);
		addMessage(userMsg);
		addMessage(aiMsg);
		threads.values.push(thread);
		saveThread(thread);

		goto(resolve(`/chat/${threadId}`));
	}

	onMount(async () => {
		mounted = true;

		const inputElement = document.getElementById('input-element') as HTMLInputElement;
		inputElement.focus();
	});
</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	<title>Grade AI</title>
</svelte:head>

<div
	class="flex flex-1 flex-col items-center justify-center overflow-y-scroll bg-background px-4 py-20"
>
	<div class="w-full max-w-2xl min-w-[320px]">
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

		<div
			class={`relative z-10 transition-all delay-100 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
		>
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
					class="text-primary-foreground absolute right-2 rounded-lg bg-primary p-2 transition-colors hover:bg-primary/90 disabled:bg-primary/20"
					onclick={sendMessage}
					id="send-message-button"
				>
					<Icon icon="lucide:arrow-right" class="h-4 w-4" />
				</button>
			</div>

			<div class="mt-4 flex items-center justify-center gap-2">
				{#if modelsLoading.value}
					<div class="flex gap-2">
						<div class="h-8 w-24 animate-pulse rounded-lg bg-secondary"></div>
						<div class="h-8 w-28 animate-pulse rounded-lg bg-secondary"></div>
						<div class="h-8 w-20 animate-pulse rounded-lg bg-secondary"></div>
					</div>
				{:else}
					<div class="flex rounded-lg bg-secondary p-1">
						<button
							class={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${defaultMode.value == 'direct' ? 'text-primary-foreground bg-card-foreground/10' : 'text-muted-foreground hover:text-foreground'}`}
							onclick={() => {
								defaultMode.value = 'direct';
							}}>Direct Model</button
						>
						<button
							class={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${defaultMode.value == 'socratic' ? 'text-primary-foreground bg-card-foreground/10' : 'text-muted-foreground hover:text-foreground'}`}
							onclick={() => {
								defaultMode.value = 'socratic';
							}}>Socratic Models</button
						>
					</div>

					<div bind:this={menuRef} class="relative">
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
								class="absolute top-full right-0 z-40 mt-2 h-[30vh] max-h-60 min-h-20 min-w-40 overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
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
				{/if}
			</div>
		</div>

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

{#if isAuthenticated.value && !userData.value.academicLevel}
	<Onboarding />
{/if}

<style>
	textarea {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
