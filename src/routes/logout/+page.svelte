<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';

	async function logout() {
		signOut();
	}
</script>

<svelte:head>
	<title>Grade AI - Logout</title>
</svelte:head>

<div class="logout flex h-full flex-col items-center justify-center gap-5">
	<h1 class="text-xl sm:text-2xl">Are you sure you want to sign out?</h1>

	<div class="options flex flex-row gap-5">
		<button class="btn btn-error" onclick={logout}>Yes</button>
		<button class="btn btn-accent" onclick={() => (window.location.href = '/')}>No</button>
	</div>
</div>
