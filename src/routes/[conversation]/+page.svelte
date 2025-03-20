<script lang="ts">
	import { conversationsList, currentSlug, sidebarStatus } from '$lib/stores/store';
	import type { messagesType, ConversationType, MessageType } from '$lib/types/types';
	import apiConfig from '$lib/utils/apiConfig';
	import { onMount } from 'svelte';
	import { chatSession } from '$lib/utils/geminiModal';
	import Loading from '../components/loading.svelte';
	import { isAuthenticated } from '$lib/stores/store';
	import { selectedModal } from '$lib/stores/store';
	import Selectmodal from '../components/selectModal.svelte';
	import { modalList } from '$lib/utils/modalList';
	import { goto } from '$app/navigation';
	import { autoResize } from '$lib/utils/autoResize';
	import { customChatSession } from '$lib/utils/customGeminiModal';
	import { db } from '$lib/db/db';
	import { liveQuery } from 'dexie';
	import SelectModal from '../components/selectModal.svelte';

	let messages: any = [];
	let conversation: any = [];
	let loading: boolean = false;
	let email: string = '';
	let userEmail: string = '';
	let chatName: string = 'New Chat';
	let result: any;
	let displayMessages: any = [];
	let slug: string = '';
	let SpeechRecognition;
	let SpeechGrammarList;
	let SpeechRecognitionEvent;
	let recognition: any;

	onMount(async () => {
		email = localStorage.getItem('Email')?.toString() || '';
		// SLUG
		slug = location.pathname.split('/')[1];
		currentSlug.set(slug);
		// SELECTED MODAL
		const savedSelectedModal = localStorage.getItem('SelectedModal');
		if (savedSelectedModal) {
			// @ts-expect-error
			selectedModal.set(savedSelectedModal);
		} else {
			selectedModal.set(modalList[0].id);
		}
		// console.log('Conv currentslug: ', $currentSlug);
		currentSlug.subscribe(async (value) => {
			// console.log('Conversation:', value);
			if (value) {
				slug = value;
				try {
					const storedConversations = liveQuery(() => db.conversations.toArray());
					storedConversations.subscribe((value: any) => {
						// console.log('savedConversations:', value);
						for (let i = 0; i < value.length; i++) {
							if (value[i].slug == slug) {
								// console.log(value[i].content);
								conversation = value[i];
								break;
							}
						}
						if (conversation) {
							messages = [conversation.content];
						}
					});
				} catch (error) {
					console.log('error:', error);
				}
			}
		});
		sidebarStatus.subscribe((value) => {
			if (value == 'opened') {
				document.getElementById('chat-log')?.classList.remove('sideBarClosedWidth');
				document.getElementById('chat-log')?.classList.add('sideBarOpenWidth');

				document.getElementById('input-area')?.classList.remove('sideBarClosedWidthInput');
				document.getElementById('input-area')?.classList.add('sideBarOpenWidthInput');

				document.getElementById('chat-log')?.classList.remove('absolute');
			} else {
				document.getElementById('chat-log')?.classList.remove('sideBarOpenWidth');
				document.getElementById('chat-log')?.classList.add('sideBarClosedWidth');

				document.getElementById('input-area')?.classList.remove('sideBarOpenWidthInput');
				document.getElementById('input-area')?.classList.add('sideBarClosedWidthInput');

				document.getElementById('chat-log')?.classList.add('absolute');
			}
		});
		// @ts-expect-error
		SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

		recognition = new SpeechRecognition();
	});
	async function sendMessage() {
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
			if (
				$selectedModal == 'gemini-2.0-flash_custom_trained' ||
				$selectedModal == 'gemini-2.0-flash'
			) {
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
						const response = await fetch(`${apiConfig.apiUrl}`, {
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
					const response = await fetch(`${apiConfig.apiUrl}ai/chat/${$selectedModal}`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							email: userEmail,
							prompt: userInput,
							modalParams: {
								type: $selectedModal.endsWith('_custom_trained') ? 'custom' : 'direct'
							}
						})
					});
					const result = await response.json();
					console.log(result.data);
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
			const updateStoredConv = await db.conversations.update(slug, {
				content: [...conversation.content, [{ prompt: userMessage, response: aiMessage }]]
			});
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
	function speak(messageContent: string) {
		const formattedContent = messageContent
			.replace(/<html>/g, '')
			.replace(/<\/html>/g, '')
			.replace(/<body>/g, '')
			.replace(/<\/body>/g, '')
			.replace(/<h1>/g, '')
			.replace(/<\/h1>/g, '')
			.replace(/<p>/g, '')
			.replace(/<\/p>/g, '')
			.replace(/<b>/g, '')
			.replace(/<\/b>/g, '');
		const utterance = new SpeechSynthesisUtterance(formattedContent);

		const voices = speechSynthesis.getVoices();
		utterance.voice = voices[0]; // Use the first voice

		speechSynthesis.speak(utterance);
	}
	async function microphone() {
		recognition.start();
		console.log('Listening...');
		recognition.onresult = async function (event: any) {
			const transcript = event.results[0][0].transcript;
			console.log(transcript.split(' '));
			if (transcript.split(' ').includes('Hey') || transcript.split(' ').includes('hey')) {
				result = await chatSession.sendMessage(transcript);
				const jsonResult = result.response.text().replace(/json/, '').replace(/`/g, '');
				const summary = JSON.parse(jsonResult).summary;
				const text = JSON.parse(jsonResult).content.replace(/`/g, '');
				console.log(result.response.text());
				console.log(JSON.parse(jsonResult));
				console.log('summary:', summary);
				console.log('content:', text);
				speak(text);
			}
		};
	}
</script>

<svelte:head>
	<title>Grade AI - Chat</title>
</svelte:head>

<div class="main flex h-screen w-screen">
	<div class="content h-screen w-full">
		<div class="chat-log sideBarOpenWidth absolute left-0 right-0 p-1 pr-10" id="chat-log">
			{#each messages as eachMessage}
				{#each eachMessage as individualMessage}
					<div class="user">
						<div class="chat chat-end">
							<div class="chat-header">
								{individualMessage[0].prompt.sender}
							</div>
							<div class="chat-bubble">
								{individualMessage[0].prompt.content}
							</div>
						</div>
					</div>
					<div class="AI">
						<div class="chat chat-start">
							<div class="chat-header">
								{individualMessage[0].response.sender}
							</div>
							<div class="chat-bubble bg-base-200">
								{@html individualMessage[0].response.content}
							</div>
						</div>
					</div>
				{/each}
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
		<div class="flex h-screen w-full">
			<div class="input-area-bottom sideBarOpenWidthInput bg-base-300 p-2" id="input-area">
				<textarea
					class="userInput mb-2"
					rows="1"
					id="userInput"
					placeholder="Ask me anything..."
					on:keydown={handleKeyDown}
					on:input={autoResize}
				></textarea>
				<div class="flex w-full items-center justify-between">
					<div class="select-modal">
						<SelectModal />
					</div>
					<div class="buttons flex gap-3">
						{#if isAuthenticated}
							<div class="tootltip ml-auto" data-tip="Speak">
								<button
									type="button"
									aria-label="Send"
									class="microphone-button"
									on:click={microphone}
								>
									<svg
										width="40px"
										height="40px"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M19 10V12C19 15.866 15.866 19 12 19M5 10V12C5 15.866 8.13401 19 12 19M12 19V22M8 22H16M15 6H13M15 10H13M12 15C10.3431 15 9 13.6569 9 12V5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V12C15 13.6569 13.6569 15 12 15Z"
											stroke="#6B7280"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</button>
							</div>
						{/if}
						<div class="tootltip" data-tip="Send">
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
</div>

<div class="sideBarClosedWidth sideBarClosedWidthInput hidden"></div>

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
		height: 100vh;
		padding-bottom: 130px;
		overflow-y: scroll;
		justify-content: flex-start;
		gap: 5px;
		align-items: center;
	}
	.userInput {
		min-height: 10px;
		max-height: 60px;
		height: 45px;
		min-width: 16rem;
		width: 65vw;
		max-width: 75vw;
		border: none;
		padding-left: 5px;
		padding-right: 5px;
		resize: none;
		overflow-y: auto;
		background-color: transparent;
	}
	.sideBarOpenWidthInput {
		transform: translateX(8%);
	}
	.sideBarClosedWidthInput {
		left: 11%;
	}
	.input-area-bottom {
		height: 130px;
		padding: 20px;
		justify-content: flex-start;
		position: fixed;
		bottom: -5px;
		border-radius: 15px;
		transform: translateX(8%);
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
		.microphone-button svg {
			width: 30px;
			height: 30px;
		}
	}
	.select-modal {
		flex-shrink: 0;
		border: none;
	}
</style>
