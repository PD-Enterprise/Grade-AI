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

	let messages: any = [];
	let conversation: any = [];
	let loading: boolean = false;
	let email: string = '';
	let userEmail: string = '';
	let chatName: string = 'New Chat';
	let result: any;
	let displayMessages: any = [];
	let slug: string = '';

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
				try {
					const storedConversations = liveQuery(() => db.conversations.toArray());
					storedConversations.subscribe((value: any) => {
						// console.log('savedConversations:', value);
						for (let i = 0; i < value.length; i++) {
							if (value[i].slug == slug) {
								// console.log(value[i].content);
								messages = [...messages, value[i].content];
								break;
							}
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
			} else {
				document.getElementById('chat-log')?.classList.remove('sideBarOpenWidth');
				document.getElementById('chat-log')?.classList.add('sideBarClosedWidth');
			}
		});
	});
	async function sendMessage() {
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
		} else {
			console.log($selectedModal);
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
				console.log('asd');
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

			const updatedConversation = {
				prompt: userMessage,
				response: aiMessage
			};
			// console.log('Old conv', savedConversations);
			const newConversation = {
				name: conversation.name,
				slug: conversation.slug,
				content: [...conversation.content, updatedConversation]
			};
			// console.log('New conv', newConversation);
			const conversationListWithoutCurrentConversation = $conversationsList.filter(
				(conv) => conv.slug !== conversation.slug
			);
			// console.log(
			// 	'conversationListWithoutCurrentConversation',
			// 	conversationListWithoutCurrentConversation
			// );
			const newConversationList = [...conversationListWithoutCurrentConversation, newConversation];
			// console.log(newConversationList);
			localStorage.setItem('Conversations', JSON.stringify(newConversationList));
		} catch (error) {
			error = error;
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
</script>

<svelte:head>
	<title>Grade AI - Chat</title>
</svelte:head>

<div class="main flex h-screen w-screen">
	<div class="content h-screen w-full">
		<div class="chat-log sideBarOpenWidth bg-blue-500" id="chat-log">
			{#each messages[0] as message}
				<div class="user">
					<div class="chat chat-end">
						<div class="chat-header">
							{message.prompt.sender}
						</div>
						<div class="chat-bubble">
							{message.prompt.content}
						</div>
					</div>
				</div>
				<div class="AI">
					<div class="chat chat-start">
						<div class="chat-header">
							{message.response.sender}
						</div>
						<div class="chat-bubble bg-base-200">
							{@html message.response.content}
						</div>
					</div>
				</div>
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
	</div>
</div>

<div class="sideBarClosedWidth hidden"></div>

<style>
	.sideBarOpenWidth {
		width: calc(100vw - 220px);
	}
	.sideBarClosedWidth {
		width: 100vw;
	}
	.chat-log {
		height: calc(100vh - 165px);
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
</style>
