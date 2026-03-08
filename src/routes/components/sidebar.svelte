<script lang="ts">
	import Icon from '@iconify/svelte';
	import { sidebarStatus } from '$lib/stores/store.svelte';
</script>

<div class="sidebar flex h-full flex-col gap-2">
	<header class="header flex flex-row items-center justify-between">
		<a class="btn rounded p-2 text-xl font-bold text-white btn-ghost btn-accent" href="/"
			>Grade AI</a
		>
		<button
			class="btn rounded p-2 btn-ghost btn-accent"
			on:click={() => (sidebarStatus.value = !sidebarStatus.value)}
		>
			<Icon icon="ic:round-view-sidebar" width="24" height="24" />
		</button>
	</header>

	<div class="action-bar">
		<a class="p- btn border-none btn-ghost btn-accent hover:bg-base-100" href="/">
			<Icon icon="ic:round-edit-note" width="24" height="24" />
			<span class="ml-2">New Chat</span>
		</a>
	</div>

	<div class="list flex flex-1 flex-col gap-1 overflow-y-scroll pl-2">
		<span>Your Chats</span>
		{#each Array(20) as _, i}
			<a
				href={`/chat/` + `This is thread ${i + 1}`.replaceAll(' ', '_')}
				class="btn h-7 justify-start rounded p-0 pt-4 pb-4 btn-ghost hover:bg-base-100"
				>{`This is thread ${i + 1}`.replaceAll(' ', '_')}</a
			>
		{/each}
	</div>

	<div class="auth flex flex-col justify-end">
		<button class="btn rounded bg-base-300 hover:bg-base-100">Login</button>
	</div>
</div>
