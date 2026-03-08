<script lang="ts">
	import Icon from '@iconify/svelte';
	import { page } from '$app/state';
	import type { ChatMessage } from '$lib/types';

	let slug = $derived(page.params.thread);

	const messages: ChatMessage[] = [
		{ role: 'user', content: 'Hello, how are you?' },
		{ role: 'assistant', content: 'I am fine, thank you for asking.' },
		{ role: 'user', content: 'What is your name?' },
		{ role: 'assistant', content: 'My name is Grade AI.' },
		{ role: 'user', content: 'What is your purpose?' },
		{ role: 'assistant', content: 'My purpose is to help you with any questions you have.' },
		{ role: 'user', content: 'Can you help me with my homework?' },
		{ role: 'assistant', content: 'I am sorry, but I am not able to help you with your homework.' }
	];
</script>

<div class="thread-container flex h-full flex-col gap-2">
	<header>
		<h2 class="font-bold">Thread {slug}</h2>
	</header>

	<div class="chat-container over flex flex-1 flex-col-reverse gap-2 overflow-y-scroll p-2">
		{#each messages.reverse() as message}
			{#if message.role === 'user'}
				<div class="chat-end chat">
					<div class="chat-header">
						{message.role}
					</div>
					<div class="chat-bubble bg-base-300">{message.content}</div>
				</div>
			{:else}
				<div class="chat-start chat">
					<div class="chat-header">
						{message.role}
					</div>
					<div class="chat-bubble bg-base-200">{message.content}</div>
				</div>
			{/if}
		{/each}
	</div>

	<div class="input-group flex w-full flex-col gap-3 rounded-2xl rounded-b-none bg-base-200 p-3">
		<div class="input-field">
			<input
				type="text"
				placeholder="Enter your question here"
				class="input w-full rounded border-none bg-base-200 p-0 focus:outline-none"
			/>
		</div>
		<div class="action-bar flex flex-row justify-between gap-3">
			<select class="model-selection select rounded border-none bg-base-200 focus:outline-none">
				{#each Array(3) as _, i}
					<option value={i}>Model {i + 1}</option>
				{/each}
			</select>
			<button class="btn rounded hover:bg-base-100"
				><Icon icon="ic:round-send" width="24" height="24" /></button
			>
		</div>
	</div>
</div>
