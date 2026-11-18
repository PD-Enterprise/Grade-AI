<script lang="ts">
	import IconArrowUp from '~icons/lucide/arrow-up';
	import IconMenu from '~icons/lucide/menu';
	import IconZap from '~icons/lucide/zap';
	import IconSparkles from '~icons/lucide/sparkles';
	import { onMount } from 'svelte';

	import {
		currentModel,
		defaultMode,
		modelList,
		modelsLoading,
		userData,
		isAuthenticated,
		threads,
		pageLoading,
		sidebarStatus
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
		threads.values.unshift(thread);
		saveThread(thread);

		goto(resolve(`/chat/${threadId}`));
	}

	onMount(async () => {
		mounted = true;
		pageLoading.value = false;
	});
</script>

<svelte:head>
	<title>Grade AI</title>
</svelte:head>

<div class="relative flex flex-1 flex-col overflow-y-scroll bg-background">
	<div class="flex items-center gap-1 px-3 py-2">
		{#if !sidebarStatus.value}
			<button
				onclick={() => (sidebarStatus.value = true)}
				class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
				aria-label="Open sidebar"
			>
				<IconMenu class="h-4 w-4" />
			</button>
		{/if}
		{#if modelsLoading.value}
			<div class="h-7 w-24 animate-pulse rounded-full bg-secondary"></div>
		{:else}
			<ModelSelector align="left" />
		{/if}
	</div>
	<div class="flex flex-1 flex-col items-center justify-center px-4 pb-20">
		<div class="flex w-full max-w-2xl min-w-[320px] flex-col gap-6">
			<div
				class={`logo-and-title flex flex-col gap-3 text-center transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
			>
				<p class="text-3xl font-semibold tracking-tight text-muted-foreground">
					Hello {userData.value.name}
				</p>
				<p class="text-4xl">How can I help you learn today?</p>
			</div>

			<div
				class={`relative z-10 transition-all delay-100 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
			>
				<div
					class="flex flex-col gap-1 rounded-2xl border border-border bg-card/80 p-2.5 shadow-lg shadow-black/20 backdrop-blur-md transition-colors focus-within:border-primary/50"
				>
					<!-- svelte-ignore a11y_autofocus -->
					<textarea
						bind:value={prompt}
						use:grow={{ value: prompt }}
						onkeydown={(e) => handleKeyDown(e, sendMessage)}
						placeholder="Ask anything..."
						rows="1"
						class="max-h-[200px] min-h-[24px] w-full resize-none overflow-y-auto border-none bg-transparent px-1 py-1 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:ring-0 focus:outline-none"
						id="input-element"
						autofocus
					></textarea>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-1.5"></div>
						<div class="flex items-center gap-1.5">
							{#if !modelsLoading.value}
								<div class="relative flex rounded-full bg-secondary p-0.5">
									<div
										class="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-card-foreground/10 transition-all duration-300 ease-in-out"
										style="left: {defaultMode.value === 'direct' ? '2px' : 'calc(50%)'}"
									></div>
									<button
										class="relative z-10 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200"
										class:text-foreground={defaultMode.value === 'direct'}
										class:text-muted-foreground={defaultMode.value !== 'direct'}
										onclick={() => {
											defaultMode.value = 'direct';
										}}>Direct</button
									>
									<button
										class="relative z-10 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200"
										class:text-foreground={defaultMode.value === 'socratic'}
										class:text-muted-foreground={defaultMode.value !== 'socratic'}
										onclick={() => {
											defaultMode.value = 'socratic';
										}}>Socratic</button
									>
								</div>
							{/if}
							<button
								disabled={!prompt.trim()}
								class="text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:bg-primary/20 disabled:opacity-50"
								onclick={sendMessage}
								id="send-message-button"
								aria-label="Send message"
							>
								<IconArrowUp class="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
				<div class="mt-1.5 text-center text-xs text-muted-foreground/60">
					Press Enter to send, Shift + Enter for new line
				</div>
			</div>

			<div
				class={`grid grid-cols-2 gap-4 transition-all delay-200 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
			>
				<div class="rounded-xl border border-border/50 bg-card/50 p-4">
					<IconZap class="mb-2 h-5 w-5 text-primary" />
					<div class="text-sm font-medium">Direct Answers</div>
					<div class="mt-1 text-xs text-muted-foreground">Get instant responses from AI models</div>
				</div>
				<div class="rounded-xl border border-border/50 bg-card/50 p-4">
					<IconSparkles class="mb-2 h-5 w-5 text-primary" />
					<div class="text-sm font-medium">Socratic Learning</div>
					<div class="mt-1 text-xs text-muted-foreground">Learn through guided questions</div>
				</div>
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
