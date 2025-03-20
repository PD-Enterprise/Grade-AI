<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import auth from '$lib/utils/authService';
	import { auth0Client, isAuthenticated, user, userRole, sidebarStatus } from '$lib/stores/store';
	import apiConfig from '$lib/utils/apiConfig';
	import Sidebar from './components/sidebar.svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();

	onMount(async () => {
		// SIDEBAR
		const sideBar = document.getElementById('side-bar') as HTMLElement;
		const leftButton = document.getElementById('left-button') as HTMLElement;
		const rightButton = document.getElementById('right-button') as HTMLElement;
		if (localStorage.getItem('Sidebar') == 'closed') {
			sidebarStatus.set('closed');
			sideBar.classList.add('hidden');
			leftButton.classList.add('hidden');
			rightButton.classList.remove('hidden');
		} else {
			sidebarStatus.set('opened');
			sideBar.classList.remove('hidden');
			leftButton.classList.remove('hidden');
			rightButton.classList.add('hidden');
		}
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
	});
	function openSidebar() {
		const sideBar = document.getElementById('side-bar') as HTMLElement;
		const leftButton = document.getElementById('left-button') as HTMLElement;
		const rightButton = document.getElementById('right-button') as HTMLElement;
		if (sideBar && leftButton && rightButton) {
			sideBar.classList.remove('hidden');
			sideBar.classList.remove('fade-out-left');
			leftButton.classList.remove('hidden');
			rightButton.classList.add('hidden');
		}
		localStorage.setItem('Sidebar', 'opened');
		sidebarStatus.set('opened');
	}
	function closeSidebar() {
		const sideBar = document.getElementById('side-bar') as HTMLElement;
		const leftButton = document.getElementById('left-button') as HTMLElement;
		const rightButton = document.getElementById('right-button') as HTMLElement;
		if (sideBar && leftButton && rightButton) {
			sideBar.classList.remove('hidden');
			sideBar.classList.add('fade-out-left');
			leftButton.classList.add('hidden');
			rightButton.classList.remove('hidden');
		}
		localStorage.setItem('Sidebar', 'closed');
		sidebarStatus.set('closed');
	}
</script>

<div class="main flex overflow-hidden">
	<div class="control absolute z-30 pt-2">
		<div class="left-button" id="left-button">
			<button aria-label="close sidebar" class="btn btn-ghost w-12" onclick={closeSidebar}>
				<svg
					width="20px"
					height="20px"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M11 5V19M6 8H8M6 11H8M6 14H8M6.2 19H17.8C18.9201 19 19.4802 19 19.908 18.782C20.2843 18.5903 20.5903 18.2843 20.782 17.908C21 17.4802 21 16.9201 21 15.8V8.2C21 7.0799 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V15.8C3 16.9201 3 17.4802 3.21799 17.908C3.40973 18.2843 3.71569 18.5903 4.09202 18.782C4.51984 19 5.07989 19 6.2 19Z"
						stroke="#6b7280"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
		<div class="right-button absolute ml-1 hidden rounded-md bg-base-200 p-1" id="right-button">
			<button aria-label="open sidebar " class="btn btn-ghost w-12" onclick={openSidebar}>
				<svg
					width="20px"
					height="20px"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M11 5V19M6 8H8M6 11H8M6 14H8M6.2 19H17.8C18.9201 19 19.4802 19 19.908 18.782C20.2843 18.5903 20.5903 18.2843 20.782 17.908C21 17.4802 21 16.9201 21 15.8V8.2C21 7.0799 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V15.8C3 16.9201 3 17.4802 3.21799 17.908C3.40973 18.2843 3.71569 18.5903 4.09202 18.782C4.51984 19 5.07989 19 6.2 19Z"
						stroke="#6b7280"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{#if $isAuthenticated}
				<button
					aria-label="Add New Conversation"
					class="fade-in-top btn btn-ghost w-12 p-0"
					onclick={() => {
						localStorage.setItem('Sidebar', 'closed');
						goto('/');
					}}
				>
					<svg
						width="20px"
						height="20px"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<g id="Edit / Add_Plus">
							<path
								id="Vector"
								d="M6 12H12M12 12H18M12 12V18M12 12V6"
								stroke="#6B7280"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</g>
					</svg>
				</button>
			{/if}
		</div>
	</div>
	<div class="side-bar fade-in-left z-20" id="side-bar">
		<Sidebar />
	</div>
	<div class="main-content h-screen w-screen">
		{@render children()}
	</div>
</div>

<div class="fade-out-left hidden"></div>

<style>
	.fade-in-left {
		animation: fade-in-left 0.5s ease forwards;
	}
	.fade-in-top {
		animation: fade-in-top 0.6s ease forwards;
	}
	.fade-out-left {
		animation: fade-out-left 0.5s ease forwards;
	}
	@keyframes fade-in-left {
		0% {
			transform: translateX(-100%);
			opacity: 0;
		}
		100% {
			transform: translateX(0);
			opacity: 1;
		}
	}
	@keyframes fade-in-top {
		0% {
			transform: translateY(-100%);
			opacity: 0;
		}
		100% {
			transform: translateY(0);
			opacity: 1;
		}
	}
	@keyframes fade-out-left {
		0% {
			transform: translateX(0);
			opacity: 1;
		}
		100% {
			transform: translateX(-100%);
			opacity: 0;
		}
	}
</style>
