<script lang="ts">
	import { conversationsList, currentSlug, userRole, welcomeMessage } from '$lib/stores/store';
	import type { messagesType, ConversationType, MessageType, modalType } from '$lib/types/types';
	import apiConfig from '$lib/utils/apiConfig';
	import { onMount } from 'svelte';
	import { chatSession } from '$lib/utils/geminiModal';
	import Loading from '../components/loading.svelte';
	import { writable } from 'svelte/store';
	import { generateUuid } from '$lib/utils/generateUuid';
	import { isAuthenticated } from '$lib/stores/store';
	import { selectedModal } from '$lib/stores/store';
	import Selectmodal from '../components/selectModal.svelte';

	let messages: messagesType[] = [];
	let conversations: ConversationType[] = [];
	const generationConfig = {
		temperature: 1,
		topP: 0.95,
		topK: 40,
		maxOutputTokens: 8192,
		responseMimeType: 'text/plain'
	};
	let loading: boolean = false;
	let email: string = '';
	let error = '';
	let modalList: modalType[] = [
		{
			name: 'Gemini 2.0 flash(Custom Trained)',
			id: 'gemini-2.0-flash_custom_trained',
			description: "Google's latest and greatest model, custom trained.",
			roleRequirement: 'tier-1',
			type: 'custom'
		},
		{
			name: 'Gemini 2.0 flash',
			id: 'gemini-2.0-flash',
			description: "Google's latest and greatest model.",
			roleRequirement: 'tier-1',
			type: 'direct'
		},
		{
			name: 'Llama 3.3',
			id: 'llama-3.3-70b-versatile',
			description: "Meta's powerful and adaptable LLM.",
			roleRequirement: 'tier-2',
			type: 'direct'
		},
		{
			name: 'Llama 3.3(Custom Trained)',
			id: 'llama-3.3-70b-versatile_custom_trained',
			description: "Meta's powerful and adaptable LLM, custom trained.",
			roleRequirement: 'tier-2',
			type: 'custom'
		},
		{
			name: 'Deepseek r1',
			id: 'deepseek-r1-distill-llama-70b',
			description: 'Distilled LLama-70B, optimized for efficiency.',
			roleRequirement: 'tier-3',
			type: 'direct'
		},
		{
			name: 'Deepseek r1(Custom Trained)',
			id: 'deepseek-r1-distill-llama-70b_custom_trained',
			description: 'Distilled LLama-70B, optimized for efficiency, custom trained.',
			roleRequirement: 'tier-3',
			type: 'custom'
		}
	];
	let sidebarOpened: string | null = 'true';
	let userEmail: string = '';
	let chatName: string = 'New Chat';
	let slug: string = '';

	onMount(async () => {
		email = localStorage.getItem('Email')?.toString() || '';
		const slug = location.pathname.split('/')[1];
		currentSlug.set(slug);
		// Sort conversations based on prompt time
		// conversations.sort((a, b) => {
		// 	const timeA = new Date(a.prompt.time).getTime();
		// 	const timeB = new Date(b.prompt.time).getTime();
		// 	return timeA - timeB;
		// });
		const savedSelectedModal = localStorage.getItem('SelectedModal');
		if (savedSelectedModal) {
			// @ts-expect-error
			selectedModal.set(savedSelectedModal);
		} else {
			// @ts-expect-error
			selectedModal.set(modalList[0].id);
		}

		const inputAreaDivElement = document.getElementById('input-area') as HTMLDivElement;
		inputAreaDivElement.classList.remove('input-area');
		inputAreaDivElement.classList.add('input-area-bottom');

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
	currentSlug.subscribe((slug) => {
		if (slug) {
			const savedConversations = JSON.parse(localStorage.getItem('Conversations') || '[]');
			const conversation = savedConversations.find(
				(conversation: any) => conversation.slug == slug
			);
			messages = [conversation.prompt, conversation.response];
			if (conversation) {
				conversationsList.set([conversation]);
			}
		}
	});
	async function sendMessage() {
		welcomeMessage.set(false);
		const chatLogElement = document.getElementById('chat-log') as HTMLDivElement;
		if (chatLogElement) {
			chatLogElement.classList.remove('hidden');
		}

		const inputAreaElement = document.getElementById('userInput') as HTMLInputElement;
		const userInput = inputAreaElement.value.trim();
		chatName = userInput.replace(/ /g, '');
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
	function speak(messageContent: string) {
		const formattedContent = messageContent
			.replace(/<p>/g, '')
			.replace(/<\/p>/g, '')
			.replace(/<b>/g, '')
			.replace(/<\/b>/g, '');
		const utterance = new SpeechSynthesisUtterance(formattedContent);

		const voices = speechSynthesis.getVoices();
		utterance.voice = voices[0]; // Use the first voice

		speechSynthesis.speak(utterance);
	}
</script>

<svelte:head>
	<title>Grade AI - Chat</title>
</svelte:head>

<div class="main flex">
	<div class="content">
		<div class="chat-log w-screen max-w-7xl" id="chat-log">
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
								<button
									aria-label="Speak"
									on:click={() => {
										speak(message.content);
									}}
									class="tooltip btn btn-ghost"
									data-tip="Speak"
								>
									<svg
										width="15px"
										height="150pxpx"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											fill-rule="evenodd"
											clip-rule="evenodd"
											d="M10.4 1.8C11.5532 0.262376 14 1.07799 14 3.00001V21.1214C14 23.0539 11.5313 23.8627 10.3878 22.3049L6.49356 17H4C2.34315 17 1 15.6569 1 14V10C1 8.34315 2.34315 7 4 7H6.5L10.4 1.8ZM12 3L8.1 8.2C7.72229 8.70361 7.12951 9 6.5 9H4C3.44772 9 3 9.44772 3 10V14C3 14.5523 3.44772 15 4 15H6.49356C7.13031 15 7.72901 15.3032 8.10581 15.8165L12 21.1214V3Z"
											fill="#6B7280"
										/>
										<path
											d="M16.2137 4.17445C16.1094 3.56451 16.5773 3 17.1961 3C17.6635 3 18.0648 3.328 18.1464 3.78824C18.4242 5.35347 19 8.96465 19 12C19 15.0353 18.4242 18.6465 18.1464 20.2118C18.0648 20.672 17.6635 21 17.1961 21C16.5773 21 16.1094 20.4355 16.2137 19.8256C16.5074 18.1073 17 14.8074 17 12C17 9.19264 16.5074 5.8927 16.2137 4.17445Z"
											fill="#6B7280"
										/>
										<path
											d="M21.41 5C20.7346 5 20.2402 5.69397 20.3966 6.35098C20.6758 7.52413 21 9.4379 21 12C21 14.5621 20.6758 16.4759 20.3966 17.649C20.2402 18.306 20.7346 19 21.41 19C21.7716 19 22.0974 18.7944 22.2101 18.4509C22.5034 17.5569 23 15.5233 23 12C23 8.47672 22.5034 6.44306 22.2101 5.54913C22.0974 5.20556 21.7716 5 21.41 5Z"
											fill="#6B7280"
										/>
									</svg>
								</button>
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
					<Selectmodal />
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
