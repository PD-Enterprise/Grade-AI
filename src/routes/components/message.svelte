<script lang="ts">
	import type { ChatRole } from '$lib/types';
	import 'katex/dist/katex.min.css';
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import { KatexRenderer, markedKatex } from '@humanspeak/svelte-markdown/extensions';
	import type { RendererComponent, Renderers } from '@humanspeak/svelte-markdown';
	import Icon from '@iconify/svelte';

	type SpeakStatus = 'idle' | 'loading' | 'playing' | 'paused';
	interface props {
		index: number;
		role: ChatRole;
		content: string;
		model?: string;
	}
	interface KatexRenderers extends Renderers {
		inlineKatex: RendererComponent;
		blockKatex: RendererComponent;
	}

	const { index, role, content, model = undefined }: props = $props();
	const renderers: Partial<KatexRenderers> = {
		inlineKatex: KatexRenderer,
		blockKatex: KatexRenderer
	};
	let isFirefox = $state();
	let smallScreen = $state(typeof window !== 'undefined' && window.innerWidth < 770);
	let status = $state<SpeakStatus>('idle');
	let utterance: SpeechSynthesisUtterance | null = null;
	let currentContent = $state('');
	let voicesReady = $state(false);

	function initSpeech(): Promise<void> {
		if (voicesReady) return Promise.resolve();
		if (!window.speechSynthesis) {
			voicesReady = true;
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			const voices = window.speechSynthesis.getVoices();
			if (voices.length) {
				voicesReady = true;
				resolve();
				return;
			}
			window.speechSynthesis.onvoiceschanged = () => {
				voicesReady = true;
				resolve();
			};
		});
	}

	function stop() {
		window.speechSynthesis?.cancel();
		status = 'idle';
		currentContent = '';
	}
	async function speak(text: string) {
		if (!window.speechSynthesis) return;
		if (status !== 'idle' && currentContent === text) {
			stop();
			return;
		}
		window.speechSynthesis.cancel();
		status = 'loading';
		currentContent = text;
		await initSpeech();
		utterance = new SpeechSynthesisUtterance(text);
		utterance.onstart = () => {
			status = 'playing';
		};
		utterance.onend = () => {
			status = 'idle';
			currentContent = '';
		};
		utterance.onerror = () => {
			status = 'idle';
			currentContent = '';
		};
		utterance.onpause = () => {
			status = 'paused';
		};
		utterance.onresume = () => {
			status = 'playing';
		};
		window.speechSynthesis.speak(utterance);
	}
	function pause() {
		window.speechSynthesis?.pause();
		status = 'paused';
	}
	function resume() {
		window.speechSynthesis?.resume();
		status = 'playing';
	}
	function onResize() {
		smallScreen = window.innerWidth < 770;
	}
	$effect(() => {
		isFirefox = navigator.userAgent.includes('Mozilla');

		if (typeof window === 'undefined') return;
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<div class="message animate-enter flex" style={`animation-delay: ${Math.min(index * 30, 300)}ms; `}>
	{#if role === 'user'}
		<div class="ml-auto max-w-xl">
			<div class="rounded-2xl bg-primary/10 px-5 py-3 text-sm leading-relaxed text-foreground">
				<SvelteMarkdown source={content} extensions={[markedKatex()]} {renderers} />
			</div>
		</div>
	{:else}
		<div class="group text-sm leading-relaxed text-foreground max-md:text-xs">
			{#if content === ''}
				<span class="loading loading-sm loading-dots"></span>
			{:else}
				<SvelteMarkdown source={content} extensions={[markedKatex()]} {renderers} />
				<div class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground/50">
					{#if model}
						<span
							class="transition-opacity {!smallScreen ? 'opacity-0 group-hover:opacity-100' : ''}"
							>{model}</span
						>
					{/if}
					{#if !isFirefox}
						{#if status === 'idle'}
							<button
								class="btn rounded px-1 btn-ghost btn-xs"
								onclick={() => speak(content)}
								title="Read aloud"
							>
								<Icon icon="lucide:volume-2" class="h-3.5 w-3.5" />
							</button>
						{:else if status === 'loading'}
							<span class="loading loading-sm loading-dots"></span>
						{:else if status === 'playing'}
							<button class="btn rounded px-1 btn-ghost btn-xs" onclick={pause} title="Pause">
								<Icon icon="lucide:pause" class="h-3.5 w-3.5" />
							</button>
							<button class="btn rounded px-1 btn-ghost btn-xs" onclick={stop} title="Stop">
								<Icon icon="lucide:square" class="h-3.5 w-3.5" />
							</button>
						{:else if status === 'paused'}
							<button class="btn rounded px-1 btn-ghost btn-xs" onclick={resume} title="Resume">
								<Icon icon="lucide:play" class="h-3.5 w-3.5" />
							</button>
							<button class="btn rounded px-1 btn-ghost btn-xs" onclick={stop} title="Stop">
								<Icon icon="lucide:square" class="h-3.5 w-3.5" />
							</button>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
