<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}
	const { children }: Props = $props();
</script>

<div class="max-w-full overflow-x-auto">
	<table>
		{@render children?.()}
	</table>
</div>
