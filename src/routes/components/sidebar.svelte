<script lang="ts">
	import Icon from '@iconify/svelte';
	import { isAuthenticated, sidebarStatus, userData } from '$lib/stores/store.svelte';
	import { resolve } from '$app/paths';
	import { threads } from '$lib/stores/store.svelte';
	import { onMount } from 'svelte';
	import type { Thread } from '$lib/types';
	import { goto } from '$app/navigation';

	let image: string | undefined = $state('');

	function deleteThread(threadId: string) {
		const currentThread = threads.values.find((t) => t.id === threadId);
		if (currentThread) {
			threads.values = threads.values.filter((t) => t.id !== threadId);
			localStorage.removeItem(`thread: "${threadId}"`);
			goto(resolve('/'));
		}
	}
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
		if (userData.value.image) {
			image = userData.value.image;
		} else {
			image = undefined;
		}
	});
</script>

<div class="sidebar flex h-full flex-col gap-2">
	<header class="header flex flex-row items-center justify-between">
		<a class="btn rounded p-2 text-xl font-bold text-white btn-ghost btn-accent" href={resolve('/')}
			>Grade AI</a
		>
		<button
			class="btn rounded p-2 btn-ghost btn-accent"
			onclick={() => (sidebarStatus.value = !sidebarStatus.value)}
		>
			<Icon icon="ic:round-view-sidebar" width="24" height="24" />
		</button>
	</header>

	<div class="action-bar">
		<a class="p- btn border-none btn-ghost btn-accent hover:bg-base-100" href={resolve('/')}>
			<Icon icon="ic:round-edit-note" width="24" height="24" />
			<span class="ml-2">New Chat</span>
		</a>
	</div>

	<div class="list flex flex-1 flex-col gap-1 overflow-y-scroll">
		{#each threads.values as thread (thread.id)}
			<div class="each-thread relative flex h-8 flex-row items-center justify-between gap-1">
				<a
					href={resolve(`/chat/${thread.id}`)}
					class="overflow-y-hide h-full w-full content-center justify-start rounded p-1 hover:bg-base-100"
				>
					{thread.title}
				</a>
				<div class="menu-btn absolute right-0">
					<button
						class="btn h-8 w-8 rounded bg-base-300 p-0 btn-ghost hover:bg-base-100"
						onclick={() => deleteThread(thread.id)}
					>
						<Icon icon="ic:round-close" width="16" height="16" />
					</button>
				</div>
			</div>
		{/each}
	</div>

	<div class="auth flex flex-col justify-end">
		{#if isAuthenticated.value}
			<button
				class="user-profile-shortcut btn flex flex-row items-center gap-2 rounded bg-base-300 p-0 btn-ghost hover:bg-base-100"
				onclick={() => {
					const user_profile_modal = document.getElementById(
						'user-profile-modal'
					) as HTMLDialogElement;
					user_profile_modal.showModal();
				}}
			>
				{#if image}
					<div class="avatar">
						<div class="w-5 rounded">
							<img src={image} alt="PFP" />
						</div>
					</div>
				{:else}
					<div class="avatar avatar-placeholder">
						<div class="w-5 rounded-full bg-neutral text-neutral-content">
							<span class="text-3xl">{userData.value.name.split('')[0]}</span>
						</div>
					</div>
				{/if}
				<span>
					{userData.value.name}
				</span>
			</button>
		{:else}
			<a class="btn rounded bg-base-300 hover:bg-base-100" href={resolve('/login')}>Login</a>
		{/if}
	</div>
</div>

<dialog id="user-profile-modal" class="modal">
	<div class="modal-box rounded bg-base-200">
		<h3 class="text-lg font-bold">Hello {userData.value.name}!</h3>
		<p class="py-4">
			Membership: {userData.value.membership}
		</p>
		<div class="modal-action justify-between">
			<a
				class="btn rounded btn-error"
				href={resolve('/logout')}
				onclick={() => {
					const modal = document.getElementById('user-profile-modal') as HTMLDialogElement;
					modal.close();
				}}
			>
				Logout
			</a>

			<form method="dialog">
				<button class="btn">Close</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<style>
	.each-thread .menu-btn {
		display: none;
	}
	.each-thread:hover .menu-btn {
		display: block;
	}
</style>
