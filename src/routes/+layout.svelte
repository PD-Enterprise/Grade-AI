<script lang="ts">
	import { sidebarStatus } from '$lib/stores/store.svelte';
	import { onMount } from 'svelte';
	import Sidebar from './components/sidebar.svelte';
	import './layout.css';
	import Icon from '@iconify/svelte';

	let { children } = $props();

	$effect(() => {
		console.log('sidebar:', sidebarStatus.value);
	});
</script>

<div class="main flex overflow-y-hidden">
	<section class="sidebar h-screen flex-1 bg-base-200 p-2">
		{#if sidebarStatus.value}
			<Sidebar />
		{:else}
			<div class="sidebar-action-bar flex flex-col gap-2">
				<button
					class="btn p-2 btn-ghost btn-accent"
					onclick={() => (sidebarStatus.value = !sidebarStatus.value)}
				>
					<Icon icon="ic:round-view-sidebar" width="24" height="24" />
				</button>
				<a class="btn p-2 btn-ghost btn-accent" href="/">
					<Icon icon="ic:round-plus" width="24" height="24" />
				</a>
			</div>
		{/if}
	</section>
	<section class={`body h-screen ${sidebarStatus.value ? 'flex-5' : 'flex-50'} p-2`}>
		{@render children()}
	</section>
</div>
