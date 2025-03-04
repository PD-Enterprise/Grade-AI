<script lang="ts">
	import { welcomeMessage } from '$lib/stores/welcomeMessage';
	import type { messagesType, ConversationType, MessageType } from '$lib/types/messages';
	import apiConfig from '$lib/utils/apiConfig';
	import { onMount } from 'svelte';
	import {
		GoogleGenerativeAI,
		HarmCategory,
		HarmBlockThreshold,
		ChatSession
	} from '@google/generative-ai';
	import Loading from './components/loading.svelte';

	let messages: messagesType[] = [];
	let conversations: ConversationType[] = [];
	let modal: '2.0-flash' = '2.0-flash';
	const generationConfig = {
		temperature: 1,
		topP: 0.95,
		topK: 40,
		maxOutputTokens: 8192,
		responseMimeType: 'text/plain'
	};
	let chatSession: any;
	let loading: boolean = false;
	let email: string = '';
	let error = '';

	onMount(() => {
		email = localStorage.getItem('Email')?.toString() || '';
		// Load existing conversations from localStorage
		const savedConversations = localStorage.getItem('Conversations');
		if (savedConversations) {
			conversations = JSON.parse(savedConversations);

			// Sort conversations based on prompt time
			conversations.sort((a, b) => {
				const timeA = new Date(a.prompt.time).getTime();
				const timeB = new Date(b.prompt.time).getTime();
				return timeA - timeB;
			});

			// Reconstruct messages array from sorted conversations for display
			messages = conversations.flatMap((conv) => [conv.prompt, conv.response]);

			// Position input bar at the bottom if there are existing messages
			const inputAreaDiv = document.getElementById('input-area') as HTMLDivElement;
			if (inputAreaDiv && messages.length > 0) {
				inputAreaDiv.classList.remove('input-area');
				inputAreaDiv.classList.add('input-area-bottom');
			}
		}

		welcomeMessage.set(messages.length === 0); // Only show welcome message if no messages exist

		welcomeMessage.subscribe((value) => {
			const chatLogElement = document.getElementById('chat-log') as HTMLDivElement;
			if (!value) {
				chatLogElement.classList.remove('hidden');
			}
		});

		const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
		const modal = genAI.getGenerativeModel({
			model: 'gemini-2.0-flash',
			systemInstruction:
				'You are a Socratic Teacher. And I am your student. And please try to keep your replies as brief as possible, while explaining each topic carefully. Please Explain the topic in relation to the NCERT CBSE 2024 curriculum, no need to keep mentioning it. Please give a starting point to get started, your job is to help the student find the answer in his/her own way. Also please return your answer in HTML format, with proper tags.'
		});
		chatSession = modal.startChat({
			generationConfig
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
	});
	async function sendMessage() {
		welcomeMessage.set(false);
		const chatLogElement = document.getElementById('chat-log') as HTMLDivElement;
		if (chatLogElement) {
			chatLogElement.classList.remove('hidden');
		}

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
				sender: `Gemini-${modal}`,
				time: new Date().toLocaleTimeString()
			};
			messages = [...messages, errorMessage];

			const conversation: ConversationType = {
				prompt: userMessage,
				response: errorMessage
			};
			conversations = [...conversations, conversation];
			localStorage.setItem('Conversations', JSON.stringify(conversations));
		} else {
			sendQueryToAI(userInput, userMessage).then(() => {
				setTimeout(() => {
					if (chatLog) {
						chatLog.scrollTo(0, chatLog.scrollHeight);
					}
				}, 500);
			});
			inputAreaElement.value = '';
		}
	}
	async function sendQueryToAI(prompt: string, userMessage: MessageType) {
		if (!email) {
			try {
				loading = true;
				const result = await chatSession.sendMessage(prompt);
				const text = result.response.text().replace(/html/, '').replace(/`/g, '');
				loading = false;

				const aiMessage: MessageType = {
					content: text,
					sender: `Gemini-${modal}`,
					time: new Date().toLocaleTimeString()
				};

				messages = [...messages, aiMessage];

				const conversation: ConversationType = {
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
</script>

<svelte:head>
	<title>Grade AI - Chat</title>
</svelte:head>

<div class="main flex">
	<div class="side-bar"></div>
	<div class="content">
		{#if $welcomeMessage}
			<div class="welcome-message flex h-screen w-screen items-center justify-center">
				<p class="text-center text-3xl">How can i help you today?</p>
			</div>
		{/if}
		<div class="chat-log hidden" id="chat-log">
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
							<div class="chat-bubble">
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
						<div class="chat-bubble">
							<Loading />
						</div>
					</div>
				</div>
			{/if}
		</div>
		<div class="input-area flex flex-wrap" id="input-area">
			<textarea
				class="userInput"
				placeholder="Ask me anything..."
				rows="1"
				id="userInput"
				on:keydown={handleKeyDown}
				on:input={autoResize}
			></textarea>
			<div class="tooltip" data-tip="Send">
				<button type="button" on:click={sendMessage} aria-label="Send" class="send-button"
					><svg
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
					</svg></button
				>
			</div>
			<div class="input-area-bottom hidden"></div>
		</div>
	</div>
</div>

<style>
	.chat-log {
		/* background-color: red; */
		height: calc(100vh - 150px);
		width: 100vw;
		overflow-y: scroll;
	}
	.welcome-message {
		margin-top: -100px;
	}
	.userInput {
		min-height: 10px;
		max-height: 60px;
		height: 45px;
		min-width: 200px;
		max-width: 75vw;
		width: 75vw;
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
		justify-content: flex-end;
		/* align-items: center; */
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 10px;
		gap: 5px;
	}
	.input-area-bottom {
		background-color: var(--color-base-300);
		height: 130px;
		padding: 10px;
		justify-content: flex-end;
		position: fixed;
		left: 50%;
		bottom: -5px;
		transform: translateX(-50%);
		border-radius: 10px;
		gap: 5px;
	}
</style>
