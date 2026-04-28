<script lang="ts">
	import { isAuthenticated, sidebarStatus, threads, userData } from '$lib/stores/store.svelte';
	import Sidebar from './components/sidebar.svelte';
	import './layout.css';
	import Icon from '@iconify/svelte';
	import { resolve } from '$app/paths';
	import NotLoggedIn from './components/notLoggedIn.svelte';
	import { onMount } from 'svelte';
	import type { Thread } from '$lib/types';

	let { data, children } = $props();

	onMount(() => {
		let tempThreads: Thread[] = [];

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('thread:')) {
				const threadData = localStorage.getItem(key);
				if (threadData) {
					tempThreads.push(JSON.parse(threadData));
				}
			}
		}

		if (tempThreads.length > 0) {
			threads.values.push(...tempThreads);
		}
	});
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

		// console.log(sidebarStatus.value);
	});
</script>

<div class="flex h-screen overflow-hidden bg-background text-foreground">
	{#if !isAuthenticated.value}
		<!-- <NotLoggedIn /> -->
	{/if}

	<!-- Sidebar -->
	<dib class="transition-all duration-300 ease-out">
		<!-- <Sidebar /> -->
	</dib>

	<!-- Sidebar Action Bar -->
	{#if sidebarStatus.value}
		<div class="sidebar-action-bar fixed top-4 left-4 z-500 flex flex-col gap-1">
			<button
				onclick={() => (sidebarStatus.value = !sidebarStatus.value)}
				class="rounded-full bg-secondary p-3 transition-colors hover:bg-secondary/80"
				aria-label="Open sidebar"
			>
				<Icon icon="lucide:menu" class="h-4 w-4" />
			</button>
			<a
				class="rounded-full bg-secondary p-3 transition-colors hover:bg-secondary/80"
				href={resolve('/')}
			>
				<Icon icon="lucide:plus" class="h-4 w-4" />
			</a>
		</div>
	{/if}

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		{@render children()}
	</div>
</div>
