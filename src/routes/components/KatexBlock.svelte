<script lang="ts">
	import { KatexRenderer } from '@humanspeak/svelte-markdown/extensions';

	interface Props {
		text: string;
		displayMode?: boolean;
	}
	const { text, displayMode = true }: Props = $props();
</script>

<div class="max-w-full overflow-x-auto">
	<KatexRenderer {text} {displayMode} />
</div>
