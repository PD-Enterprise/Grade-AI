<script lang="ts">
	import {
		isAuthenticated,
		sidebarStatus,
		threads,
		userData,
		currentModel,
		defaultMode,
		modelList
	} from '$lib/stores/store.svelte';
	import { loadAllThreads } from '$lib/threads';
	import Sidebar from './components/sidebar.svelte';
	import './layout.css';
	import Icon from '@iconify/svelte';
	import { resolve } from '$app/paths';
	import NotLoggedIn from './components/notLoggedIn.svelte';
	import { onMount } from 'svelte';
	import { goto, afterNavigate } from '$app/navigation';

	let { data, children } = $props();

	async function getModelListFromApi() {
		try {
			const response = await fetch('/', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await response.json();
			if (result.status === 200 && result.data?.length) {
				modelList.values = result.data;
				return result.data;
			}
		} catch (e) {
			console.error('Error fetching model list:', e);
		}
		return [];
	}

	onMount(() => {
		threads.values = loadAllThreads();

		const localDefaultMode = localStorage.getItem('defaultMode');
		if (localDefaultMode) {
			defaultMode.value = localDefaultMode as 'direct' | 'socratic';
		}

		const localCurrentModel = localStorage.getItem('CurrentModel');
		if (localCurrentModel) {
			currentModel.value = localCurrentModel;
		}
	});

	afterNavigate(async () => {
		const models = await getModelListFromApi();
		if (
			models.length > 0 &&
			(!currentModel.value ||
				!models.some((m: { modelName: string }) => m.modelName === currentModel.value))
		) {
			currentModel.value = models[0].modelName;
		}
	});

	$effect(() => {
		if (currentModel.value) {
			localStorage.setItem('CurrentModel', currentModel.value);
		}
		if (defaultMode.value) {
			localStorage.setItem('defaultMode', defaultMode.value);
		}
	});

	$effect(() => {
		if (!data.session) {
			isAuthenticated.value = false;
		} else {
			isAuthenticated.value = true;
			const user = data.session.user;
			if (!user) {
				console.error('User does not exist');
				goto(resolve('/'));
			}
			userData.value = {
				name: user?.name ? user?.name : '',
				email: user?.email ? user?.email : '',
				image: user?.image,
				membership: data.membership,
				academicLevel: data.academicLevel
			};
		}
	});
</script>

<div class="flex h-screen overflow-hidden bg-background text-foreground">
	{#if !isAuthenticated.value}
		<NotLoggedIn />
	{/if}

	<!-- Sidebar -->
	<div
		class={`transition-all duration-300 ease-out ${sidebarStatus.value ? 'w-72' : 'w-0'} overflow-hidden`}
	>
		<Sidebar />
	</div>

	<!-- Sidebar Action Bar -->
	{#if !sidebarStatus.value}
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
