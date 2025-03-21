<script lang="ts">
	import { isAuthenticated, sidebarStatus, welcomeMessage } from '$lib/stores/store';
	import type { messagesType, ConversationType, MessageType } from '$lib/types/types';
	import { onMount } from 'svelte';
	import { customChatSession } from '$lib/utils/customGeminiModal';
	import Loading from './components/loading.svelte';
	import { goto } from '$app/navigation';
	import { chatSession } from '$lib/utils/geminiModal';
	import { selectedModal } from '$lib/stores/store';
	import SelectModal from './components/selectModal.svelte';
	import { autoResize } from '$lib/utils/autoResize';
	import { db } from '$lib/db/db';
	import { liveQuery } from 'dexie';

	let messages: messagesType[] = [];
	let loading: boolean = false;
	let email: string = '';
	let userEmail: string = '';
	let chatName: string = 'New Chat';
	let result: any;

	onMount(async () => {
		email = localStorage.getItem('Email')?.toString() || '';

		sidebarStatus.subscribe((value) => {
			if (value == 'opened') {
				document.getElementById('mid')?.classList.remove('sideBarClosedWidth');
				document.getElementById('mid')?.classList.add('sideBarOpenWidth');

				document.getElementById('input-area')?.classList.remove('sideBarClosedWidthInput');
				document.getElementById('input-area')?.classList.add('sideBarOpenWidthInput');

				document.getElementById('welcome-message')?.classList.remove('absolute');
				document.getElementById('chat-log')?.classList.remove('absolute');
			} else {
				document.getElementById('mid')?.classList.add('sideBarOpenWidth');
				document.getElementById('mid')?.classList.remove('sideBarClosedWidth');

				document.getElementById('input-area')?.classList.remove('sideBarOpenWidthInput');
				document.getElementById('input-area')?.classList.add('sideBarClosedWidthInput');

				document.getElementById('welcome-message')?.classList.add('absolute');
				document.getElementById('chat-log')?.classList.add('absolute');
			}
		});
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
		} else {
			if ($selectedModal == 'gemini-2.0-flash_custom_trained' || 'gemini-2.0-flash') {
				if (!$isAuthenticated) {
					if (messages.length <= 20) {
						sendQueryToAI(userInput, userMessage, $selectedModal);
					} else {
						const errorMessage: MessageType = {
							content:
								'<p>Sorry, you have reached the limit of 20 messages. To continue with your chat and do more, please login.</p>',
							sender: $selectedModal,
							time: new Date().toLocaleTimeString()
						};
						messages = [...messages, errorMessage];
					}
				} else {
					sendQueryToAI(userInput, userMessage, $selectedModal);
				}
			} else {
				if (!$isAuthenticated) {
					if (messages.length <= 20) {
						const response = await fetch(``, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								email: userEmail,
								prompt: userInput
							})
						});
						const result = await response.json();
						console.log(result);
					} else {
						const errorMessage: MessageType = {
							content:
								'<p>Sorry, you have reached the limit of 20 messages. To continue with your chat and do more, please login.</p>',
							sender: $selectedModal,
							time: new Date().toLocaleTimeString()
						};
						messages = [...messages, errorMessage];
					}
				} else {
					const response = await fetch(``, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							email: userEmail,
							prompt: userInput
						})
					});
					const result = await response.json();
					console.log(result);
				}
			}
			inputAreaElement.value = '';
		}
	}
	async function sendQueryToAI(prompt: string, userMessage: MessageType, selectedModal: string) {
		try {
			loading = true;
			switch (selectedModal) {
				case 'gemini-2.0-flash':
					result = await chatSession.sendMessage(prompt);
					break;
				case 'gemini-2.0-flash_custom_trained':
					result = await customChatSession.sendMessage(prompt);
					break;
			}
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
				sender: selectedModal,
				time: new Date().toLocaleTimeString()
			};
			messages = [...messages, aiMessage];
			const addConversation = await db.conversations.add({
				id: chatName.replace(/ /g, '-').toLowerCase(),
				name: chatName,
				slug: chatName.toLowerCase().replaceAll(' ', '-').replaceAll('"', ''),
				content: [[{ prompt: userMessage, response: aiMessage }]]
			});
			welcomeMessage.set(true);
			goto(`/${chatName.toLowerCase().replaceAll(' ', '-')}`);
		} catch (error) {
			error = error;
		} finally {
			loading = false;
		}
	}
	function handleKeyDown(event: any) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
</script>

<svelte:head>
	<title>Grade AI - Chat</title>
</svelte:head>

<div class="main flex w-screen">
	<div class="content w-full">
		<div
			class="chat-log sideBarOpenWidth absolute left-0 right-0 hidden w-screen max-w-7xl"
			id="chat-log"
		>
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
		<div
			class="mid sideBarOpenWidth flex h-screen flex-col items-center justify-center gap-4"
			id="mid"
		>
			{#if $welcomeMessage}
				<div class="welcome-message absolute left-0 right-0" id="welcome-message">
					<p class="text-center text-3xl">How can i help you today?</p>
				</div>
			{/if}
			<div class="input-area-bottom" id="input-area">
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
						<SelectModal />
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
			</div>
		</div>
	</div>
</div>

<div
	class="sideBarClosedWidth input-area-bottom sideBarClosedWidthInput sideBarClosedWidthWelcome hidden"
></div>

<style>
	.main {
		background: linear-gradient(135deg, var(--color-base-100), var(--color-base-200));
	}
	.sideBarOpenWidth {
		width: calc(100vw - 220px);
	}
	.sideBarClosedWidth {
		width: 100vw;
	}
	.chat-log {
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
	.userInput {
		min-height: 10px;
		max-height: 60px;
		height: 45px;
		min-width: 16rem;
		width: 67vw;
		max-width: 75vw;
		border: none;
		padding-left: 5px;
		padding-right: 5px;
		resize: none;
		overflow-y: auto;
		background-color: transparent;
	}
	.sideBarClosedWidthInput {
		transform: translateX(8%);
		left: 11%;
	}
	.input-area-bottom {
		height: 130px;
		padding: 20px;
		justify-content: flex-start;
		position: fixed;
		bottom: -5px;
		border-radius: 10px;
		gap: 5px;
		align-items: center;
		background-color: var(--base-300);
		backdrop-filter: blur(15px);
	}
	@media (max-width: 450px) {
		.input-area-bottom {
			width: 100vw;
			transform: translateX(0%);
			left: 0%;
		}
		.send-button svg {
			width: 30px;
			height: 30px;
		}
	}
	.select-modal {
		flex-shrink: 0;
		border: none;
	}
</style>
