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
		threads,
		pageLoading
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
	import ModelSelector from './components/ModelSelector.svelte';

	let prompt: string = $state('');
	let mounted: boolean = $state(false);

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
		pageLoading.value = false;

		const inputElement = document.getElementById('input-element') as HTMLInputElement;
		inputElement.focus();
	});
</script>

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
			<h1 class="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
				Grade AI
			</h1>
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
					<div class="relative flex rounded-lg bg-secondary p-1">
						<div
							class="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-card-foreground/10 transition-all duration-300 ease-in-out"
							style="left: {defaultMode.value === 'direct' ? '4px' : 'calc(50%)'}"
						></div>
						<button
							class="relative z-10 flex-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200"
							class:text-primary-foreground={defaultMode.value === 'direct'}
							class:text-muted-foreground={defaultMode.value !== 'direct'}
							onclick={() => {
								defaultMode.value = 'direct';
							}}>Direct Mode</button
						>
						<button
							class="relative z-10 flex-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200"
							class:text-primary-foreground={defaultMode.value === 'socratic'}
							class:text-muted-foreground={defaultMode.value !== 'socratic'}
							onclick={() => {
								defaultMode.value = 'socratic';
							}}>Socratic Mode</button
						>
					</div>

					<ModelSelector />
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
