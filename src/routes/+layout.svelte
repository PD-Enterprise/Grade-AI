<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import auth from '$lib/utils/authService';
	import { auth0Client, isAuthenticated, user, userRole, sidebarStatus } from '$lib/stores/store';
	import apiConfig from '$lib/utils/apiConfig';
	import Sidebar from './components/sidebar.svelte';

	let { children } = $props();

	onMount(async () => {
		// AUTH
		const client = await auth.createClient();
		// @ts-expect-error
		auth0Client.set(client);
		// @ts-expect-error
		isAuthenticated.set(await $auth0Client.isAuthenticated());
		// @ts-expect-error
		user.set(await $auth0Client.getUser());
		// console.log($user);
		if ($user) {
			if (!localStorage.getItem('Email')) {
				// @ts-expect-error
				localStorage.setItem('Email', $user.email);
			}
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
			// console.log(result);
			localStorage.setItem('role', result.data);
			userRole.set(result.data);
		}
		// SIDEBAR
		const sideBar = document.getElementById('side-bar') as HTMLElement;
		if (localStorage.getItem('Sidebar') == 'closed') {
			sidebarStatus.set('closed');
		} else {
			sidebarStatus.set('opened');
		}
	});
</script>

<div class="main flex overflow-hidden">
	<div class="side-bar z-10">
		<Sidebar />
	</div>
	<div class="main-content w-32">
		{@render children()}
	</div>
</div>
