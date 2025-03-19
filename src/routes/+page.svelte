<script lang="ts">
	import { isAuthenticated, welcomeMessage } from '$lib/stores/store';
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

	onMount(async () => {
		email = localStorage.getItem('Email')?.toString() || '';

		welcomeMessage.set(messages.length === 0); // Only show welcome message if no messages exist

		welcomeMessage.subscribe((value) => {
			const chatLogElement = document.getElementById('chat-log') as HTMLDivElement;
			if (!value) {
				chatLogElement.classList.remove('hidden');
			}
		});
		welcomeMessage.set(true);
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
		// if (selectedModal == 'gemini-2.0-flash_custom_trained') {
		// 	try {
		// 		loading = true;
		// 		const result = await customChatSession.sendMessage(prompt);
		// 		const jsonResult = result.response.text().replace(/json/, '').replace(/`/g, '');
		// 		const summary = JSON.parse(jsonResult).summary;
		// 		chatName = summary;
		// 		const text = JSON.parse(jsonResult).content.replace(/`/g, '');
		// 		// console.log(result.response.text());
		// 		// console.log(JSON.parse(jsonResult));
		// 		// console.log('summary', summary);
		// 		// console.log('content', text);
		// 		loading = false;
		// 		const aiMessage: MessageType = {
		// 			content: text,
		// 			sender: selectedModal,
		// 			time: new Date().toLocaleTimeString()
		// 		};
		// 		messages = [...messages, aiMessage];
		// 		const conversation: ConversationType = {
		// 			id: chatName.replace(' ', '-').toLowerCase(),
		// 			name: chatName,
		// 			slug: chatName.toLowerCase().replaceAll(' ', '-'),
		// 			content: [{ prompt: userMessage, response: aiMessage }]
		// 		};
		// 		const newConversationList = [...$conversationsList, conversation];
		// 		localStorage.setItem('Conversations', JSON.stringify(newConversationList));
		// 		conversationsList.set(newConversationList);
		// 		goto(`/${conversation.slug}`);
		// 	} catch (error) {
		// 		error = error;
		// 		loading = false;
		// 	}
		// } else if (selectedModal == 'gemini-2.0-flash') {
		// 	try {
		// 		loading = true;
		// 		const result = await chatSession.sendMessage(prompt);
		// 		const jsonResult = result.response.text().replace(/json/, '').replace(/`/g, '');
		// 		const summary = JSON.parse(jsonResult).summary;
		// 		chatName = summary;
		// 		const text = JSON.parse(jsonResult).content.replace(/`/g, '');
		// 		// console.log(result.response.text());
		// 		// console.log(JSON.parse(jsonResult));
		// 		// console.log('summary', summary);
		// 		// console.log('content', text);
		// 		loading = false;
		// 		const aiMessage: MessageType = {
		// 			content: text,
		// 			sender: selectedModal,
		// 			time: new Date().toLocaleTimeString()
		// 		};
		// 		messages = [...messages, aiMessage];
		// 		const newConversation: ConversationType = {
		// 			id: chatName.replace(' ', '-').toLowerCase(),
		// 			name: chatName,
		// 			slug: chatName.toLowerCase().replaceAll(' ', '-'),
		// 			content: [
		// 				{
		// 					prompt: userMessage,
		// 					response: aiMessage
		// 				}
		// 			]
		// 		};
		// 		const newConversationList = [...$conversationsList, newConversation];
		// 		localStorage.setItem('Conversations', JSON.stringify(newConversationList));
		// 		conversationsList.set(newConversationList);
		// 		goto(`/${newConversation.slug}`);
		// 	} catch (error) {
		// 		error = error;
		// 		loading = false;
		// 	}
		// }
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

<div class="main flex">
	<div class="content">
		{#if $welcomeMessage}
			<div class="welcome-message absolute flex h-screen w-screen items-center justify-center bg-gradient-to-b from-base-300 to-base-200">
				<div class="text-center">
					<h1 class="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">Welcome to Grade AI</h1>
					<p class="text-2xl text-base-content opacity-80 mb-8">How can I help you today?</p>
					<div class="flex flex-col gap-4 items-center">
						<div class="suggestion-chips flex gap-2 flex-wrap justify-center max-w-2xl">
							<button class="chip" on:click={() => {
								const input = document.getElementById('userInput') as HTMLInputElement;
								input.value = "Help me with my homework";
								sendMessage();
							}}>Help me with my homework</button>
							<button class="chip" on:click={() => {
								const input = document.getElementById('userInput') as HTMLInputElement;
								input.value = "Explain a concept";
								sendMessage();
							}}>Explain a concept</button>
							<button class="chip" on:click={() => {
								const input = document.getElementById('userInput') as HTMLInputElement;
								input.value = "Solve a math problem";
								sendMessage();
							}}>Solve a math problem</button>
							<button class="chip" on:click={() => {
								const input = document.getElementById('userInput') as HTMLInputElement;
								input.value = "Help with coding";
								sendMessage();
							}}>Help with coding</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
		<div class="chat-log hidden w-screen max-w-7xl" id="chat-log">
			{#each messages as message}
				{#if message.sender == 'User'}
					<div class="user">
						<div class="chat chat-end">
							<div class="chat-header text-sm text-base-content opacity-70">{message.sender}</div>
							<div class="chat-bubble bg-primary text-primary-content shadow-lg">{message.content}</div>
							<div class="chat-footer text-xs text-base-content opacity-50">{message.time}</div>
						</div>
					</div>
				{:else}
					<div class="gemini">
						<div class="chat chat-start">
							<div class="chat-header text-sm text-base-content opacity-70">{message.sender}</div>
							<div class="chat-bubble bg-base-200 shadow-lg prose max-w-none">
								{@html message.content}
							</div>
							<div class="chat-footer text-xs text-base-content opacity-50">{message.time}</div>
						</div>
					</div>
				{/if}
			{/each}
			{#if loading}
				<div class="system">
					<div class="chat chat-start">
						<div class="chat-header text-sm text-base-content opacity-70">System</div>
						<div class="chat-bubble bg-base-200 shadow-lg">
							<Loading />
						</div>
					</div>
				</div>
			{/if}
		</div>
		<div class="input-area fixed bottom-0 left-0 right-0 p-4 bg-base-300 bg-opacity-80 backdrop-blur-sm border-t border-base-content border-opacity-10">
			<div class="flex gap-4 items-end max-w-7xl mx-auto">
				<SelectModal />
				<div class="flex-1">
					<textarea
						id="userInput"
						class="textarea textarea-bordered w-full min-h-[60px] max-h-[200px] resize-none bg-base-200 focus:bg-base-100 transition-colors duration-200"
						placeholder="Type your message here..."
						on:keydown={handleKeyDown}
					></textarea>
				</div>
				<button
					class="btn btn-primary h-[60px] min-h-[60px] px-6"
					on:click={sendMessage}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.chip {
		@apply px-4 py-2 rounded-full bg-base-200 hover:bg-base-300 text-base-content opacity-80 hover:text-base-content transition-all duration-200 shadow-sm hover:shadow-md;
	}

	.chat-bubble {
		@apply rounded-2xl p-4;
	}

	.chat {
		@apply mb-4;
	}

	.chat-header {
		@apply mb-1;
	}

	.chat-footer {
		@apply mt-1;
	}

	.input-area {
		transition: all 0.3s ease-in-out;
	}

	.input-area-bottom {
		@apply bottom-0;
	}

	/* Add smooth transitions for messages */
	.user, .gemini {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
