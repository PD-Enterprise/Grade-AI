<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	onMount(() => {
		const slug = $page.url.pathname;
		// console.log(slug);

		const dialog = document.getElementById('login-dialog') as HTMLDialogElement;
		if (dialog && slug !== '/login') {
			dialog.showModal();
		}
	});
</script>

<dialog id="login-dialog" class="modal">
	<div class="modal-box bg-black">
		<form method="dialog">
			<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm">✕</button>
		</form>
		<h3 class="text-lg font-bold">You are not logged in</h3>
		<p class="py-4">Please login to continue.</p>
		<button
			onclick={() => {
				const dialog = document.getElementById('login-dialog') as HTMLDialogElement;
				if (dialog) {
					dialog.close();
				}
			}}
		>
			<a href={resolve('/login')} class="btn hover:text-black hover:btn-primary">Login</a>
		</button>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
