<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import auth from '$lib/utils/authService';
	import { auth0Client, isAuthenticated, user, userRole } from '$lib/stores/store';
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
		userRole.set(result.data);
		// SIDEBAR
		const sidebarStatus = localStorage.getItem('Sidebar');
		const sideBar = document.getElementById('side-bar') as HTMLElement;
		const leftButton = document.getElementById('left-button') as HTMLElement;
		const rightButton = document.getElementById('right-button') as HTMLElement;
		if (sidebarStatus == 'closed' && sideBar && leftButton && rightButton) {
			sideBar.classList.add('hidden');
			leftButton.classList.add('hidden');
			rightButton.classList.remove('hidden');
		} else {
			sideBar.classList.remove('hidden');
			leftButton.classList.remove('hidden');
			rightButton.classList.add('hidden');
		}
	});
	function openSidebar() {
		const sideBar = document.getElementById('side-bar') as HTMLElement;
		const leftButton = document.getElementById('left-button') as HTMLElement;
		const rightButton = document.getElementById('right-button') as HTMLElement;
		if (sideBar && leftButton && rightButton) {
			sideBar.classList.remove('hidden');
			leftButton.classList.remove('hidden');
			rightButton.classList.add('hidden');
		}
		localStorage.setItem('Sidebar', 'opened');
	}
	function closeSidebar() {
		const sideBar = document.getElementById('side-bar') as HTMLElement;
		const leftButton = document.getElementById('left-button') as HTMLElement;
		const rightButton = document.getElementById('right-button') as HTMLElement;
		if (sideBar && leftButton && rightButton) {
			sideBar.classList.add('hidden');
			leftButton.classList.add('hidden');
			rightButton.classList.remove('hidden');
		}
		localStorage.setItem('Sidebar', 'closed');
	}
</script>

<div class="main flex">
	<div class="side-bar z-10">
		<Sidebar />
	</div>
	<div class="control z-10">
		<div class="left-button" id="left-button">
			<button aria-label="close sidebar" class="btn btn-ghost" onclick={closeSidebar}>
				<svg
					width="30px"
					height="30px"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M15 6L9 12L15 18"
						stroke="#6b7280"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
		<div class="right-button hidden" id="right-button">
			<button aria-label="open sidebar" class="btn btn-ghost" onclick={openSidebar}>
				<svg
					width="30px"
					height="30px"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9 6L15 12L9 18"
						stroke="#6b7280"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	</div>
	<div class="main-content">
		{@render children()}
	</div>
</div>
