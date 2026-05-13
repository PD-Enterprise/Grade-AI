<script lang="ts">
	import { currentModel } from '$lib/stores/store.svelte';
	import type { ChatRole } from '$lib/types';
	import 'katex/dist/katex.min.css';
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import { KatexRenderer, markedKatex } from '@humanspeak/svelte-markdown/extensions';
	import type { RendererComponent, Renderers } from '@humanspeak/svelte-markdown';
	interface props {
		index: number;
		role: ChatRole;
		content: string;
	}
	interface KatexRenderers extends Renderers {
		inlineKatex: RendererComponent;
		blockKatex: RendererComponent;
	}

	const { index, role, content }: props = $props();
	const renderers: Partial<KatexRenderers> = {
		inlineKatex: KatexRenderer,
		blockKatex: KatexRenderer
	};
</script>

<div class="message animate-enter flex" style={`animation-delay: ${index * 30}ms; `}>
	<div class={`flex max-w-2xl gap-4 ${role === 'user' ? 'ml-auto flex-row-reverse' : 'flex-row'}`}>
		<!-- Avater -->
		<div class="shrink-0">
			<div
				class={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-medium ${
					role === 'user'
						? 'bg-primary text-primary-foreground'
						: 'bg-secondary text-secondary-foreground'
				}`}
			>
				{role === 'user' ? 'You' : currentModel.value.split(' ')[0].slice(0, 3)}
			</div>
		</div>

		<!-- Content -->
		<div class={`flex flex-col gap-1 ${role === 'user' ? 'items-end' : 'items-start'}`}>
			{#if role === 'assistant'}
				<p class="text-xs text-muted-foreground/60">{currentModel.value}</p>
			{/if}

			<div
				class={`message-content px-5 py-4 text-sm leading-relaxed ${
					role === 'user' ? 'bg-primary/10 text-foreground' : 'bg-secondary/50 text-foreground'
				}`}
			>
				<SvelteMarkdown source={content} extensions={[markedKatex()]} {renderers} />
			</div>
		</div>
	</div>
</div>

<style>
	.message-content {
		border-radius: 1rem;
	}
</style>
