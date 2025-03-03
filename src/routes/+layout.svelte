<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="main">
	{@render children()}
</div>
