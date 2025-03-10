<script lang="ts">
	import { conversationsList, isAuthenticated, userRole, welcomeMessage } from '$lib/stores/store';
	import type {
		messagesType,
		ConversationType,
		MessageType,
		modalType,
		UserRole
	} from '$lib/types/types';
	import apiConfig from '$lib/utils/apiConfig';
	import { onMount } from 'svelte';
	import { chatSession } from '$lib/utils/customGeminiModal';
	import Loading from './components/loading.svelte';
	import { writable } from 'svelte/store';
	import { generateUuid } from '$lib/utils/generateUuid';
	import { goto } from '$app/navigation';
	import { modalList } from '$lib/utils/modalList';
	import { User } from '@auth0/auth0-spa-js';

	let messages: messagesType[] = [];
	let conversations: ConversationType[] = [];
	let selectedModal = writable<
		| 'gemini-2.0-flash_custom_trained'
		| 'gemini-2.0-flash'
		| 'llama-3.3-70b-versatile'
		| 'deepseek-r1-distill-llama-70b'
	>('gemini-2.0-flash_custom_trained');
	let loading: boolean = false;
	let email: string = '';
	let error = '';
	let sidebarOpened: string | null = 'true';
	let userEmail: string = '';
	let chatName: string = 'New Chat';

	onMount(async () => {
		email = localStorage.getItem('Email')?.toString() || '';

		welcomeMessage.set(messages.length === 0); // Only show welcome message if no messages exist

		welcomeMessage.subscribe((value) => {
			const chatLogElement = document.getElementById('chat-log') as HTMLDivElement;
			if (!value) {
				chatLogElement.classList.remove('hidden');
			}
		});

		// Scroll to bottom of chat log if messages exist
		if (messages.length > 0) {
			setTimeout(() => {
				const chatLog = document.getElementById('chat-log');
				if (chatLog) {
					chatLog.scrollTo(0, chatLog.scrollHeight);
				}
			}, 100);
		}
		sidebarOpened = localStorage.getItem('Sidebar');
		if (sidebarOpened == 'closed') {
			const sideBar = document.getElementById('side-bar') as HTMLElement;
			sideBar.classList.add('hidden');
			const leftButton = document.getElementById('left-button') as HTMLElement;
			leftButton.classList.add('hidden');
			const rightButton = document.getElementById('right-button') as HTMLElement;
			rightButton.classList.remove('hidden');
		}
		// const request = await fetch(`${apiConfig.apiUrl}ai/chat/deepseek-r1-distill-llama-70b`, {
		// 	method: 'POST',
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify({
		// 		email: userEmail,
		// 		prompt: 'Hello, how are you?'
		// 	})
		// });
		// const result = await request.json();
		// console.log(result);
	});
	async function sendMessage() {
		welcomeMessage.set(false);
		const chatLogElement = document.getElementById('chat-log') as HTMLDivElement;
		if (chatLogElement) {
			chatLogElement.classList.remove('hidden');
		}
		const inputAreaDivElement = document.getElementById('input-area') as HTMLDivElement;
		inputAreaDivElement.classList.remove('input-area');
		inputAreaDivElement.classList.add('input-area-bottom');
		const inputAreaElement = document.getElementById('userInput') as HTMLInputElement;
		const userInput = inputAreaElement.value.trim();
		const userMessage: MessageType = {
			content: userInput,
			sender: 'User',
			time: new Date().toLocaleTimeString()
		};

		messages = [...messages, userMessage];

		const chatLog = document.getElementById('chat-log');
		if (chatLog) {
			chatLog.scrollTo(0, chatLog.scrollHeight + 100);

			const messages = chatLog.children;
			const lastMessage = messages[messages.length - 1];
			lastMessage?.scrollIntoView({ behavior: 'smooth', block: 'end' });

			setTimeout(() => {
				chatLog.scrollTo(0, chatLog.scrollHeight + 100);
			}, 100);
		}

		if (userInput == '' || null) {
			const errorMessage: MessageType = {
				content: "Sorry, you didn't enter a prompt.",
				sender: $selectedModal,
				time: new Date().toLocaleTimeString()
			};
			messages = [...messages, errorMessage];

			const conversation: ConversationType = {
				name: chatName,
				slug: await generateUuid(chatName),
				prompt: userMessage,
				response: errorMessage
			};
			conversations = [...conversations, conversation];
			localStorage.setItem('Conversations', JSON.stringify(conversations));
		} else {
			if (!$isAuthenticated) {
				if (messages.length <= 20) {
					sendQueryToAI(userInput, userMessage).then(() => {
						setTimeout(() => {
							if (chatLog) {
								chatLog.scrollTo(0, chatLog.scrollHeight);
							}
						}, 500);
					});
				} else {
					const errorMessage: MessageType = {
						content:
							'Sorry, you have reached the limit of 20 messages. To continue with your chat and do more, please login.',
						sender: $selectedModal,
						time: new Date().toLocaleTimeString()
					};
					messages = [...messages, errorMessage];

					const conversation: ConversationType = {
						name: chatName,
						slug: await generateUuid(chatName),
						prompt: userMessage,
						response: errorMessage
					};
					conversations = [...conversations, conversation];
					localStorage.setItem('Conversations', JSON.stringify(conversations));
				}
			} else {
				sendQueryToAI(userInput, userMessage).then(() => {
					setTimeout(() => {
						if (chatLog) {
							chatLog.scrollTo(0, chatLog.scrollHeight);
						}
					}, 500);
				});
			}
			inputAreaElement.value = '';
		}
	}
	async function sendQueryToAI(prompt: string, userMessage: MessageType) {
		if (!email) {
			try {
				loading = true;
				const result = await chatSession.sendMessage(prompt);
				const jsonResult = result.response.text().replace(/json/, '').replace(/`/g, '');
				const summary = JSON.parse(jsonResult).summary;
				chatName = summary;
				const text = JSON.parse(jsonResult).content.replace(/`/g, '');
				// console.log(result.response.text());
				// console.log(JSON.parse(jsonResult));
				// console.log('summary', summary);
				// console.log('content', text);
				loading = false;

				const aiMessage: MessageType = {
					content: text,
					sender: $selectedModal,
					time: new Date().toLocaleTimeString()
				};

				messages = [...messages, aiMessage];

				const conversation: ConversationType = {
					name: chatName,
					slug: await generateUuid(chatName),
					prompt: userMessage,
					response: aiMessage
				};
				conversations = [...conversations, conversation];
				localStorage.setItem('Conversations', JSON.stringify(conversations));
				const newConversationList = [...$conversationsList, conversation];
				conversationsList.set(newConversationList);
				goto(`/${conversation.slug}`);
			} catch (error) {
				error = error;
				loading = false;
			}
		}
	}
	function autoResize(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight + 'px';
	}
	function handleKeyDown(event: any) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
	function changeModal(modal: modalType) {
		// @ts-expect-error
		selectedModal.set(modal.id);
		localStorage.setItem('SelectedModal', modal.id);
	}
</script>

<svelte:head>
	<title>Grade AI - Chat</title>
</svelte:head>

<div class="main flex">
	<div class="content">
		{#if $welcomeMessage}
			<div class="welcome-message absolute flex h-screen w-screen items-center justify-center">
				<p class="text-center text-3xl">How can i help you today?</p>
			</div>
		{/if}
		<div class="chat-log hidden w-screen max-w-7xl" id="chat-log">
			{#each messages as message}
				{#if message.sender == 'User'}
					<div class="user">
						<div class="chat chat-end">
							<div class="chat-header">{message.sender}</div>
							<div class="chat-bubble">{message.content}</div>
						</div>
					</div>
				{:else}
					<div class="gemini">
						<div class="chat chat-start">
							<div class="chat-header">{message.sender}</div>
							<div class="chat-bubble bg-base-200">
								{@html message.content}
							</div>
						</div>
					</div>
				{/if}
			{/each}
			{#if loading}
				<div class="system">
					<div class="chat chat-start">
						<div class="chat-header">System</div>
						<div class="chat-bubble bg-base-200">
							<Loading />
						</div>
					</div>
				</div>
			{/if}
		</div>
		<div class="input-area flex flex-wrap" id="input-area">
			<textarea
				class="userInput mb-2"
				placeholder="Ask me anything..."
				rows="1"
				id="userInput"
				on:keydown={handleKeyDown}
				on:input={autoResize}
			></textarea>
			<div class="flex w-full items-center justify-between">
				<div class="select-modal">
					<div class="dropdown dropdown-top p-1">
						<button tabindex="0" class="flex w-64 items-center" style="color: #6B7280">
							{$selectedModal}
							<svg
								width="25px"
								height="25px"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								class="mt-1"
							>
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M12.7071 14.7071C12.3166 15.0976 11.6834 15.0976 11.2929 14.7071L6.29289 9.70711C5.90237 9.31658 5.90237 8.68342 6.29289 8.29289C6.68342 7.90237 7.31658 7.90237 7.70711 8.29289L12 12.5858L16.2929 8.29289C16.6834 7.90237 17.3166 7.90237 17.7071 8.29289C18.0976 8.68342 18.0976 9.31658 17.7071 9.70711L12.7071 14.7071Z"
									stroke="#6B7280"
									fill="#6B7280"
								/>
							</svg>
						</button>
						<div class="z-1 w-54 dropdown-content menu rounded-box bg-base-300 p-2 shadow-sm">
							<ul class="tabs gap-5 p-1">
								<li id="custom">
									<button
										on:click={() => {
											const customModalList = document.getElementById(
												'custom-modals-list'
											) as HTMLElement;
											const directModalList = document.getElementById(
												'direct-modals-list'
											) as HTMLElement;
											if (directModalList && customModalList) {
												customModalList.classList.remove('hidden');
												directModalList.classList.add('hidden');
											}
										}}
									>
										Custom Trained
									</button>
								</li>
								<li id="direct">
									<button
										on:click={() => {
											const directModalList = document.getElementById(
												'direct-modals-list'
											) as HTMLElement;
											const customModalList = document.getElementById(
												'custom-modals-list'
											) as HTMLElement;
											if (customModalList) {
												directModalList.classList.remove('hidden');
												customModalList.classList.add('hidden');
											}
										}}>Direct</button
									>
								</li>
							</ul>
							<div id="custom-modals-list" class="">
								{#each modalList as modal}
									{#if modal.type == 'custom'}
										{#if modal.roleRequirement.includes($userRole as UserRole)}
											<li>
												<button class="btn-ghost" on:click={() => changeModal(modal)}
													>{modal.name}
													<div class="tooltip" data-tip={modal.description}>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															class="h-6 w-6 shrink-0 stroke-info"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															></path>
														</svg>
													</div>
												</button>
											</li>
										{:else}
											<li>
												<button class="disabled btn-ghost"
													>{modal.name}
													<div class="tooltip" data-tip={modal.description}>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															class="h-6 w-6 shrink-0 stroke-info"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															></path>
														</svg>
													</div>
												</button>
											</li>
										{/if}
									{/if}
								{/each}
							</div>
							<div id="direct-modals-list" class="hidden">
								{#each modalList as modal}
									{#if modal.type == 'direct'}
										{#if modal.roleRequirement.includes($userRole as UserRole)}
											<li>
												<button class="btn-ghost" on:click={() => changeModal(modal)}
													>{modal.name}
													<div class="tooltip" data-tip={modal.description}>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															class="h-6 w-6 shrink-0 stroke-info"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															></path>
														</svg>
													</div>
												</button>
											</li>
										{:else}
											<li>
												<button class="disabled btn-ghost"
													>{modal.name}
													<div class="tooltip" data-tip={modal.description}>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															class="h-6 w-6 shrink-0 stroke-info"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															></path>
														</svg>
													</div>
												</button>
											</li>
										{/if}
									{/if}
								{/each}
							</div>
						</div>
					</div>
				</div>
				<div class="tooltip" data-tip="Send">
					<button type="button" on:click={sendMessage} aria-label="Send" class="send-button">
						<svg
							width="40px"
							height="40px"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.3591 19.5183 15.7472 18.3818L19.9463 6.08434C20.2845 5.09409 20.4535 4.59896 20.3378 4.27142C20.2371 3.98648 20.013 3.76234 19.7281 3.66167C19.4005 3.54595 18.9054 3.71502 17.9151 4.05315L5.61763 8.2523C4.48114 8.64037 3.91289 8.83441 3.72478 9.15032C3.56153 9.42447 3.53891 9.76007 3.66389 10.0536C3.80791 10.3919 4.34498 10.6605 5.41912 11.1975L9.86397 13.42C10.041 13.5085 10.1295 13.5527 10.2061 13.6118C10.2742 13.6643 10.3352 13.7253 10.3876 13.7933C10.4468 13.87 10.491 13.9585 10.5795 14.1355Z"
								stroke="#6B7280"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>
			</div>
			<div class="input-area-bottom hidden"></div>
		</div>
	</div>
</div>

<style>
	.chat-log {
		/* background-color: red; */
		height: calc(100vh - 165px);
		width: 100vw;
		overflow-y: scroll;
		justify-content: flex-start;
		position: absolute;
		left: 50%;
		transform: translate(-50%, 0%);
		gap: 5px;
		align-items: center;
	}
	.welcome-message {
		margin-top: -100px;
		left: 0;
	}
	.userInput {
		min-height: 10px;
		max-height: 60px;
		height: 45px;
		min-width: 16rem;
		width: 69vw;
		max-width: 75vw;
		border: none;
		padding-left: 5px;
		padding-right: 5px;
		resize: none;
		overflow-y: auto;
		background-color: transparent;
	}
	.input-area {
		background-color: var(--color-base-300);
		height: 130px;
		padding: 10px;
		justify-content: flex-start;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 10px;
		gap: 5px;
		align-items: center;
	}
	.input-area-bottom {
		background-color: var(--color-base-300);
		height: 130px;
		padding: 10px;
		justify-content: flex-start;
		position: fixed;
		left: 50%;
		bottom: -5px;
		transform: translateX(-50%);
		border-radius: 10px;
		gap: 5px;
		align-items: center;
	}
	.select-modal {
		flex-shrink: 0;
		border: none;
	}
	.disabled {
		cursor: not-allowed;
		color: #545c69;
	}
</style>
