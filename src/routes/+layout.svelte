<script lang="ts">
	import { isAuthenticated, sidebarStatus, userData } from '$lib/stores/store.svelte';
	import Sidebar from './components/sidebar.svelte';
	import './layout.css';
	import Icon from '@iconify/svelte';
	import { fly, fade } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import NotLoggedIn from './components/notLoggedIn.svelte';

	let { data, children } = $props();

	$effect(() => {
		if (!data.session) {
			isAuthenticated.value = false;
		} else {
			isAuthenticated.value = true;
			if (data.user) {
				// console.log(data.user);
				userData.value = {
					name: data.user.name,
					email: data.user.email,
					image: data.user.image,
					membership: data.membership
				};
			}
		}
	});
</script>

<div class="main flex overflow-y-hidden">
	{#if !isAuthenticated.value}
		<NotLoggedIn />
	{/if}
	{#if sidebarStatus.value}
		<aside
			class="sidebar h-screen flex-1 bg-base-200 p-2 transition-all ease-in-out"
			in:fly={{ x: -20, duration: 50 }}
			out:fade={{ duration: 50 }}
		>
			<Sidebar />
		</aside>
	{:else}
		<aside class="sidebar h-screen flex-1 bg-base-200 p-2 transition-all ease-in-out">
			<div class="sidebar-action-bar flex flex-col gap-2">
				<button
					class="btn p-2 btn-ghost btn-accent"
					onclick={() => (sidebarStatus.value = !sidebarStatus.value)}
				>
					<Icon icon="ic:round-view-sidebar" width="24" height="24" />
				</button>
				<a class="btn p-2 btn-ghost btn-accent" href={resolve('/')}>
					<Icon icon="ic:round-plus" width="24" height="24" />
				</a>
			</div>
		</aside>
	{/if}
	<section class={`body h-screen ${sidebarStatus.value ? 'flex-5' : 'flex-50'}`}>
		{@render children()}
	</section>
</div>
