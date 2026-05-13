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
	{#if role === 'user'}
		<div class="ml-auto max-w-xl">
			<div class="rounded-2xl bg-primary/10 px-5 py-3 text-sm leading-relaxed text-foreground">
				<SvelteMarkdown source={content} extensions={[markedKatex()]} {renderers} />
			</div>
		</div>
	{:else}
		<div class="text-[15px] leading-relaxed text-foreground">
			<SvelteMarkdown source={content} extensions={[markedKatex()]} {renderers} />
		</div>
	{/if}
</div>
