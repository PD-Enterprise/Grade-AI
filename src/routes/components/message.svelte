<script lang="ts">
	import { currentModel } from '$lib/stores/store.svelte';
	import type { ChatRole } from '$lib/types';
	import Markdown from 'svelte-exmarkdown';

	interface props {
		index: number;
		role: ChatRole;
		content: string;
	}

	const { index, role, content }: props = $props();
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
				class={`message-content px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap ${
					role === 'user' ? 'bg-primary/10 text-foreground' : 'bg-secondary/50 text-foreground'
				}`}
			>
				<Markdown md={content} />
			</div>
		</div>
	</div>
</div>

<style>
	.message-content {
		border-radius: 1rem;
	}
</style>
