<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}
	const { children }: Props = $props();
</script>

<div class="max-w-full overflow-x-auto">
	<table class="table-block w-full table-fixed">
		{@render children?.()}
	</table>
</div>

<style>
	:global(.table-block th),
	:global(.table-block td) {
		min-width: 8rem;
		overflow-wrap: break-word;
		word-break: break-word;
	}
</style>
