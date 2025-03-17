<script lang="ts">
	// Imports
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { sidebarStatus } from '$lib/stores/store';

	// Variables
	const httpDogUrlStatusCode = writable('');
	const imgSrc = writable('https://http.dog/200.jpg');

	// Functions
	async function getStatusCode() {
		try {
			const currentUrl = window.location.href;
			const myResponse = await fetch(currentUrl);
			const statusCode: number = myResponse.status;
			console.log(statusCode);
			if (statusCode !== 200) {
				httpDogUrlStatusCode.set(statusCode.toString());
				imgSrc.set(`https://http.dog/${httpDogUrlStatusCode}.jpg`);
			}
		} catch (error) {
			console.error('There was an error:', error);
		}
	}
	onMount(() => {
		getStatusCode();
	});
</script>

{#if $sidebarStatus == 'opened'}
	<div class="side-bar-open-error flex h-screen flex-col">
		<div class="error-image flex flex-col">
			<img src={$imgSrc} class="mt-5bg-red-500" alt="Http Dog" />
			<a href="/" class="btn mb-5 mt-5 text-3xl">Go To Home</a>
		</div>
	</div>
{:else}
	<div class="side-bar-close-error flex h-screen flex-col items-center justify-center">
		<div class="error-image flex flex-col justify-center">
			<img src={$imgSrc} class="mt-5bg-red-500" alt="Http Dog" />
			<a href="/" class="btn btn-neutral mb-5 mt-5 text-3xl">Go To Home</a>
		</div>
	</div>
{/if}

<style>
	.side-bar-open-error {
		width: calc(100vw - 230px);
		img {
			width: calc(100vw - 230px);
		}
	}
	.side-bar-close-error {
		width: 100vw;
		img {
			width: calc(100vw - 230px);
		}
	}
	img {
		height: calc(100vh - 80px);
	}
</style>
