<script lang="ts">
	import BookLoader from './bookLoader.svelte';
	let props = $props();
</script>

<div class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-base-200">
	<BookLoader />
	<p>{props.title}</p>
</div>
