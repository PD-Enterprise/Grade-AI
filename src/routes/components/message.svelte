<script lang="ts">
	import type { ChatRole } from '$lib/types';
	import 'katex/dist/katex.min.css';
	import SvelteMarkdown from '@humanspeak/svelte-markdown';
	import { KatexRenderer, markedKatex } from '@humanspeak/svelte-markdown/extensions';
	import type { RendererComponent, Renderers } from '@humanspeak/svelte-markdown';
	interface props {
		index: number;
		role: ChatRole;
		content: string;
		model?: string;
		loading?: boolean;
	}
	interface KatexRenderers extends Renderers {
		inlineKatex: RendererComponent;
		blockKatex: RendererComponent;
	}

	const { index, role, content, loading = false, model = undefined }: props = $props();
	const renderers: Partial<KatexRenderers> = {
		inlineKatex: KatexRenderer,
		blockKatex: KatexRenderer
	};
</script>

<div class="message animate-enter flex" style={`animation-delay: ${index * 30}ms; `}>
	{#if role === 'user'}
		<div class="ml-auto max-w-xl">
			<div class="rounded-2xl bg-primary/10 px-5 py-3 text-sm leading-relaxed text-foreground">
				<SvelteMarkdown source={content} extensions={[markedKatex()]} {renderers} />
			</div>
		</div>
	{:else}
		<div class="group text-[15px] leading-relaxed text-foreground">
			{#if content === ''}
				<span class="loading loading-sm loading-dots"></span>
			{:else}
				<SvelteMarkdown source={content} extensions={[markedKatex()]} {renderers} />
				{#if model}
					<p
						class="mt-1 text-xs text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"
					>
						{model}
					</p>
				{/if}
			{/if}
		</div>
	{/if}
</div>
