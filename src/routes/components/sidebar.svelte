<script lang="ts">
	import Icon from '@iconify/svelte';
	import { isAuthenticated, sidebarStatus, userData } from '$lib/stores/store.svelte';
	import { resolve } from '$app/paths';
	import { threads } from '$lib/stores/store.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { validateAcademicLevel } from '$lib/utils/validateAcademicLevel';
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import { deleteThread as deleteStoredThread } from '$lib/threads';

	let image: string | undefined = $state('');
	let slug = $derived(page.params.thread);
	let selectedThread = $derived(threads.values.find((t) => t.id === slug));
	let hoveredId: string = $state('');
	let isK_12: string = $state('true');
	let academicLevel: string | undefined = $state(undefined);
	let academicLevelError: boolean = $state(false);
	let editAcademicLevel: boolean = $state(false);
	let userModelDialogue: HTMLDialogElement | undefined = $state();
	let threadToDelete: string | null = $state(null);
	let deleteModal: HTMLDialogElement | undefined = $state();

	function confirmDelete(threadId: string) {
		threadToDelete = threadId;
		deleteModal?.showModal();
	}

	async function executeDelete() {
		if (!threadToDelete) return;
		const currentThread = threads.values.find((t) => t.id === threadToDelete);
		if (currentThread) {
			threads.values = threads.values.filter((t) => t.id !== threadToDelete);
			deleteStoredThread(threadToDelete);
			try {
				await fetch(`/api/thread/${threadToDelete}`, { method: 'DELETE' });
			} catch (e) {
				console.error('Failed to delete thread on backend:', e);
			}
			deleteModal?.close();
			goto(resolve('/'));
		}
		threadToDelete = null;
	}
	async function updateAcademicLevel() {
		const response = await fetch('/', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ academicLevel: parseInt(academicLevel as string) })
		});
		const result = await response.json();
		if (result.status === 200) {
			userData.value.academicLevel = academicLevel;
		}
		userModelDialogue?.close();
	}
	onMount(() => {
		userModelDialogue = document.getElementById('user-profile-modal') as HTMLDialogElement;

		fetch('/api/threads', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
			.then((res) => res.json())
			.then((result) => {
				if (result.status === 200 && Array.isArray(result.data)) {
					const remote = result.data.map(
						(t: { clientUUID: string; title: string; createdAt: number; updatedAt: number }) => ({
							id: t.clientUUID,
							title: t.title,
							mode: 'direct' as const,
							status: 'idle' as const,
							createdAt: t.createdAt,
							updatedAt: t.updatedAt
						})
					);
					const seen = new Set(threads.values.map((t) => t.id));
					const merged = [
						...threads.values,
						...remote.filter((t: { id: string }) => !seen.has(t.id))
					];
					threads.values = merged.sort((a, b) => b.updatedAt - a.updatedAt);
				}
			})
			.catch((e) => console.error('Failed to load threads from backend:', e));
	});
	$effect(() => {
		if (userData.value.image) {
			image = userData.value.image;
		} else {
			image = undefined;
		}
	});
	$effect(() => {
		if (academicLevel == undefined) {
			academicLevel = userData.value.academicLevel;
		}

		if (academicLevel != '' && academicLevel != undefined) {
			if (!validateAcademicLevel(academicLevel)) {
				academicLevelError = true;
			} else {
				academicLevelError = false;
			}
		}
	});
</script>

<div class="relative flex h-full w-72 shrink-0 flex-col border-r border-border bg-sidebar">
	<!-- Header -->
	<div class="flex justify-between border-b border-border p-5">
		<a href={resolve('/')}>
			<div class="flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
					<Icon icon="lucide:zap" class="h-4 w-4 text-primary" />
				</div>
				<h1 class="text-lg font-semibold text-sidebar-foreground">Grade AI</h1>
			</div>
		</a>

		<button
			onclick={() => {
				sidebarStatus.value = !sidebarStatus.value;
			}}
			class="z-50 rounded-full bg-secondary p-2 transition-colors hover:bg-secondary/80"
			aria-label="Collapse sidebar"
		>
			<Icon icon="lucide:chevron-left" class="w-4" />
		</button>
	</div>

	<!-- New Chat Button -->
	<div class="p-4">
		<a
			class="text-primary-foreground flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium transition-colors hover:bg-primary/90"
			href={resolve('/')}
		>
			<Icon icon="lucide:plus" class="h-4 w-4" />
			<span>New Chat</span>
		</a>
	</div>

	<!-- Chat History -->
	<div class="flex-1 overflow-y-auto px-3 py-2">
		<h2
			class="px-3 py-2 text-xs font-medium tracking-wider text-sidebar-accent-foreground/50 uppercase"
		>
			Conversations
		</h2>
		{#if threads.values.length === 0}
			<div class="px-3 py-8 text-center">
				<Icon
					icon="lucide:message-square"
					class="mx-auto mb-3 h-8 w-8 text-sidebar-accent-foreground/20"
				/>
				<p class="text-sm text-sidebar-accent-foreground/40">No conversations yet</p>
			</div>
		{:else}
			{#each threads.values.toReversed() as thread (thread.id)}
				<button
					onclick={() => {
						goto(resolve(`/chat/${thread.id}`));
					}}
					onmouseenter={() => {
						hoveredId = thread.id;
					}}
					onmouseleave={() => {
						hoveredId = '';
					}}
					class={`group relative w-full rounded-xl px-3 py-3 text-left text-sm transition-all ${selectedThread?.id === thread.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
				>
					<div class="flex items-center gap-3">
						<Icon icon="lucide:message-square" class="h-4 w-4 shrink-0 opacity-50" />
						<span class="truncate">
							{thread.title}
						</span>
					</div>
					{#if hoveredId === thread.id}
						<!-- svelte-ignore node_invalid_placement_ssr -->
						<button
							class="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-sidebar-accent-foreground/50 transition-colors hover:bg-sidebar-accent-foreground/10 hover:text-sidebar-accent-foreground"
							onclick={(e) => {
								e.stopPropagation();
								confirmDelete(thread.id);
							}}
						>
							<Icon icon="lucide:x" class="h-3.5 w-3.5" />
						</button>
					{/if}
				</button>
			{/each}
		{/if}
	</div>

	<!-- Footer -->
	<div class="border-t border-border p-4">
		{#if isAuthenticated.value}
			<button
				class="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-sidebar-accent-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
			<a href={resolve('/login')}>
				<button
					class="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-sidebar-accent-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
				>
					Login
				</button>
			</a>
		{/if}
	</div>
</div>

<dialog id="user-profile-modal" class="modal">
	<div class="modal-box rounded-lg bg-card">
		<h3 class="mb-4 text-lg font-bold">Hello {userData.value.name}!</h3>
		<p>
			Membership: {userData.value.membership}
		</p>
		<span class="flex items-center gap-2">
			<p>
				Academic Level: {userData.value.academicLevel}
			</p>
			<button
				class="btn btn-circle border-none btn-ghost btn-xs"
				onclick={() => {
					editAcademicLevel = !editAcademicLevel;
				}}
			>
				<Icon icon="lucide:edit" class="h-4 w-4" />
			</button>
		</span>
		{#if editAcademicLevel}
			<div
				class="editAcademicLevel bg-card-foreground/10 p-2"
				in:slide={{ duration: 300 }}
				out:slide={{ duration: 200 }}
			>
				<div class="academicLevel flex flex-row gap-5">
					<select
						class="select-bordered metadata-input-field select bg-card-foreground/10"
						bind:value={isK_12}
						required
					>
						<option value="true">K-12</option>
						<option value="false">Not K-12</option>
					</select>
					{#if isK_12 == 'true'}
						<input
							type="text"
							class="input-bordered metadata-input-field input bg-card-foreground/10"
							required
							bind:value={academicLevel}
							placeholder="Academic Level"
						/>
					{:else}
						<select
							class="select-bordered metadata-input-field select bg-card-foreground/10"
							bind:value={academicLevel}
							required
						>
							<option value="13">Undergraduate (UG)</option>
							<option value="14">Graduate (G)</option>
							<option value="15">Postgraduate (PG)</option>
						</select>
					{/if}
				</div>
				{#if academicLevelError}
					<p class="mt-2 text-red-500">Please enter a valid academic level.</p>
				{/if}
				<button class="btn mt-2" onclick={updateAcademicLevel}>Save</button>
			</div>
		{/if}
		<div class="modal-action justify-between">
			<a
				class="bg-error/20 px-4 py-2.5 text-sm text-sidebar-accent-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
				href={resolve('/logout')}
				onclick={() => {
					const modal = document.getElementById('user-profile-modal') as HTMLDialogElement;
					modal.close();
				}}
			>
				Logout
			</a>

			<form method="dialog">
				<button
					class="px-4 py-2.5 text-sm text-sidebar-accent-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
					>Close</button
				>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<dialog id="delete-confirm-modal" class="modal" bind:this={deleteModal}>
	<div class="modal-box rounded-lg bg-card">
		<h3 class="mb-4 text-lg font-bold">Delete conversation?</h3>
		<p class="text-sm text-muted-foreground">
			This action cannot be undone. The conversation will be permanently deleted.
		</p>
		<div class="modal-action">
			<form method="dialog">
				<button
					class="rounded-lg border border-border px-4 py-2 text-sm text-sidebar-accent-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
				>
					Cancel
				</button>
			</form>
			<button
				class="rounded-lg bg-error px-4 py-2 text-sm text-white transition-colors hover:bg-error/80"
				onclick={executeDelete}
			>
				Delete
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
