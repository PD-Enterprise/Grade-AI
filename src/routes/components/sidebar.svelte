<script lang="ts">
	import Icon from '@iconify/svelte';
	import { sidebarStatus } from '$lib/stores/store.svelte';
	import { onMount } from 'svelte';
</script>

<div class="sidebar flex h-full flex-col gap-2">
	<header class="header flex flex-row items-center justify-between">
		<a class="roundedtext-xl btn p-2 font-bold text-white btn-ghost btn-accent" href="/">Grade AI</a
		>
		<button
			class="btn p-2 btn-ghost btn-accent"
			on:click={() => (sidebarStatus.value = !sidebarStatus.value)}
		>
			<Icon icon="ic:round-view-sidebar" width="24" height="24" />
		</button>
	</header>
	<div class="list flex flex-1 flex-col gap-1 overflow-y-scroll">
		{#each Array(20) as _, i}
			<a
				href={`/chat/` + `This is thread ${i + 1}`.replaceAll(' ', '_')}
				class="btn h-7 justify-start rounded p-2 btn-ghost hover:bg-base-100"
				>{`This is thread ${i + 1}`.replaceAll(' ', '_')}</a
			>
		{/each}
	</div>
	<div class="auth flex flex-col justify-end">
		<button class="btn rounded bg-base-300 hover:bg-base-100">Login</button>
	</div>
</div>
