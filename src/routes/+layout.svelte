<script lang="ts">
	import Sidebar from './components/sidebar.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<div class="main flex overflow-y-hidden">
	<section class="sidebar flex-1 bg-base-200 h-screen p-2">
		<Sidebar/>
	</section>
	<section class="body flex-5 h-screen p-2">
		{@render children()}
	</section>
</div>
