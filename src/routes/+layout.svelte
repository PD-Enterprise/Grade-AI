<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import auth from '$lib/utils/authService';
	import { auth0Client, isAuthenticated, user } from '$lib/stores/store';
	import apiConfig from '$lib/utils/apiConfig';
	let { children } = $props();

	onMount(async () => {
		const client = await auth.createClient();
		// @ts-expect-error
		auth0Client.set(client);
		// @ts-expect-error
		isAuthenticated.set(await $auth0Client.isAuthenticated());
		// @ts-expect-error
		user.set(await $auth0Client.getUser());
		const request = await fetch(`${apiConfig.apiUrl}users/roles/get-role`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				// @ts-expect-error
				email: $user.email
			})
		});
		const result = await request.json();
		localStorage.setItem('role', result.data);
	});
</script>

<div class="main">
	{@render children()}
</div>
