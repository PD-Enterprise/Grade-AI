<script lang="ts">
	import {
		isAuthenticated,
		sidebarStatus,
		userData,
		currentModel,
		defaultMode,
		modelList,
		modelsLoading,
		pageLoading
	} from '$lib/stores/store.svelte';
	import Sidebar from './components/sidebar.svelte';
	import './layout.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';
	import NotLoggedIn from './components/notLoggedIn.svelte';
	import Loader from './components/loader.svelte';
	import { onMount } from 'svelte';
	import { goto, afterNavigate, onNavigate } from '$app/navigation';

	let { data, children } = $props();

	let isLoaded = $state(false);
	let isMobile = $state(false);

	async function getModelListFromApi() {
		try {
			modelsLoading.value = true;
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
		} finally {
			modelsLoading.value = false;
		}
		return [];
	}

	onMount(() => {
		setTimeout(() => {
			isLoaded = true;
		}, 50);

		const localDefaultMode = localStorage.getItem('defaultMode');
		if (localDefaultMode) {
			defaultMode.value = localDefaultMode as 'direct' | 'socratic';
		}

		const localCurrentModel = localStorage.getItem('CurrentModel');
		if (localCurrentModel) {
			currentModel.value = localCurrentModel;
		}

		const mql = window.matchMedia('(max-width: 767px)');
		isMobile = mql.matches;
		if (mql.matches) {
			sidebarStatus.value = false;
		}
		const handler = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
			sidebarStatus.value = !e.matches;
		};
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	});

	afterNavigate(async () => {
		if (modelList.values.length > 0) return;
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

	onNavigate(() => {
		pageLoading.value = true;
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

{#if !isLoaded || pageLoading.value}
	<Loader title="Loading Grade AI..." />
{/if}

<div
	class="flex h-dvh overflow-hidden bg-background text-foreground {isLoaded && !pageLoading.value ? 'opacity-100' : 'opacity-0'} transition-opacity duration-400"
>
	{#if !isAuthenticated.value}
		<NotLoggedIn />
	{/if}

	<!-- Sidebar -->
	{#if isMobile}
		{#if sidebarStatus.value}
			<button
				class="fixed inset-0 z-40 cursor-default bg-black/50"
				onclick={() => (sidebarStatus.value = false)}
				onkeydown={(e) => {
					if (e.key === 'Escape') sidebarStatus.value = false;
				}}
				aria-label="Close sidebar"
			></button>
			<div class="fixed top-0 left-0 z-50 h-full shadow-xl">
				<Sidebar isMobile={true} />
			</div>
		{/if}
	{:else}
		<div
			class={`transition-all duration-300 ease-out ${sidebarStatus.value ? 'w-72' : 'w-0'} overflow-hidden`}
		>
			<Sidebar />
		</div>
	{/if}

	{#if !sidebarStatus.value && page.url.pathname === '/'}
		<button
			onclick={() => (sidebarStatus.value = !sidebarStatus.value)}
			class="fixed top-4 left-4 z-50 rounded-full bg-secondary p-3 transition-colors hover:bg-secondary/80"
			aria-label="Open sidebar"
		>
			<Icon icon="lucide:menu" class="h-4 w-4" />
		</button>
	{/if}

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		{@render children()}
	</div>
</div>
