<script lang="ts">
	import auth from '$lib/utils/authService';
	import {
		user,
		auth0Client,
		isAuthenticated,
		conversationsList,
		currentSlug
	} from '$lib/stores/store';
	import { onMount } from 'svelte';
	import type { ConversationType } from '$lib/types/types';
	import { goto } from '$app/navigation';

	let userPictureUrl: string;
	let userName: string;

	onMount(async () => {
		user.subscribe((value) => {
			if (value) {
				// @ts-expect-error
				userPictureUrl = value.picture;
				// @ts-expect-error
				userName = value.name;
			}
		});
		const storedConversations = JSON.parse(localStorage.getItem('Conversations') || '[]');
		conversationsList.set(storedConversations);
	});

	function login() {
		auth.loginWithPopup($auth0Client, {});
	}
	function deleteChat(conversation: ConversationType) {
		console.log(conversation);
	}
</script>

<div class="side-bar flex overflow-hidden p-1" id="side-bar">
	<div class="content h-screen">
		<div class="title flex">
			<p class="text-2xl">Grade AI</p>
			{#if $isAuthenticated}
				<button
					aria-label="Add New Conversation"
					class="btn btn-ghost"
					on:click={() => {
						goto('/');
					}}
				>
					<svg
						width="30px"
						height="30px"
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
		<div class="conversations mt-2 w-full list-none flex-row flex-wrap gap-3 overflow-y-scroll p-1">
			{#each $conversationsList as conversation}
				<a
					class="conversation btn btn-ghost flex w-full overflow-hidden border-r-4 p-1"
					on:click={() => {
						console.log('Sidebar:', conversation.slug);
						currentSlug.set(conversation.slug);
						console.log('sidebar currentslug:', $currentSlug);
					}}
					href="/{conversation.name.toLowerCase().replaceAll(' ', '-')}"
				>
					<svg
						width="20px"
						height="20px"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M17 3.33782C15.5291 2.48697 13.8214 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22C17.5228 22 22 17.5228 22 12C22 10.1786 21.513 8.47087 20.6622 7"
							stroke="#6B7280"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
						<path
							d="M8 12H8.009M11.991 12H12M15.991 12H16"
							stroke="#6B7280"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<p class="flex-grow">{conversation.name}</p>
					<button
						aria-label="delete conversation"
						class="tooltip btn btn-ghost"
						data-tip="Delete Conversation"
						on:click={() => {
							deleteChat(conversation);
						}}
					>
						<svg
							width="20px"
							height="20px"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17"
								stroke="#6B7280"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</a>
			{/each}
		</div>
		{#if $isAuthenticated}
			<div class="user-profile w-full p-2">
				<li class="list-none">
					<a href="/setting/user" title="Admin Dashboard" class="flex">
						<img
							src={userPictureUrl}
							alt="profile"
							title={userName}
							class="w-15 h-10 cursor-pointer rounded-full"
						/>
						<p class="ml-2 mt-2 text-sm">{userName}</p>
					</a>
				</li>
			</div>
		{:else}
			<div class="login-button">
				<button class="btn w-full p-2" on:click={login}>Login</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.side-bar {
		min-width: 180px;
		width: 18vw;
		max-width: 17rem;
		height: 100vh;
		background-color: var(--base-300);
		border-right: 1px solid #6b7280;
		backdrop-filter: blur(30px);
	}
	.conversations {
		height: calc(100vh - 100px);
		width: 100vw;
	}
	.login-button {
		position: absolute;
		bottom: 0;
		width: calc(100% - 8px);
	}
	.login-button button {
		text-align: left;
		height: 60px;
	}
	.conversation {
		height: 35px;
		max-width: 17vw;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.conversation p {
		font-size: 12px;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
	}
</style>
