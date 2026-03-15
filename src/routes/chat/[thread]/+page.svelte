<script lang="ts">
	import { generateTitle } from '$lib/utils/generateTempTitle';

	import Icon from '@iconify/svelte';

	import { page } from '$app/state';

	import { newPromptBody, threads } from '$lib/stores/store.svelte';

	import { onMount } from 'svelte';

	import type { promptBody } from '$lib/types';

	let slug = $derived(page.params.thread);

	let thread = $derived(threads.values.find((t) => t.id === slug));

	let messages = $derived(threads.values.find((t) => t.id === slug)?.messages ?? []);

	async function getResponseFromLLM(promptBody: promptBody) {
		try {
			const response = await fetch(`/chat/${slug}`, {
				method: 'POST',

				headers: { 'Content-Type': 'application/json' },

				body: JSON.stringify({ promptBody })
			});

			if (!response.body) return;

			const aiMessageId = crypto.randomUUID();

			const currentThread = threads.values.find((t) => t.id === slug);

			if (currentThread) {
				currentThread.messages.push({
					role: 'assistant',

					content: '',

					id: aiMessageId
				});
			}

			const reader = response.body.getReader();

			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				const chunk = decoder.decode(value);

				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const strData = line.replace('data: ', '').trim();

						if (strData === '[DONE]') continue;

						try {
							const json = JSON.parse(strData);

							// Your backend StreamChunk type has 'delta'

							if (json.type === 'delta' && json.delta) {
								const msg = currentThread?.messages.find((m) => m.id === aiMessageId);

								if (msg) {
									// Since it's raw HTML now, just append it directly!

									msg.content += json.delta;
								}
							}

							// eslint-disable-next-line @typescript-eslint/no-unused-vars
						} catch (error) {
							// Ignore partial JSON chunks from the SSE envelope
						}
					}
				}
			}

			// Mark as success when done

			if (currentThread) currentThread.status = 'success';
		} catch (error) {
			console.error('Streaming Error:', error);

			if (thread) thread.status = 'error';
		}
	}

	onMount(async () => {
		console.log(newPromptBody.value);

		if (newPromptBody.value && !thread) {
			const initialPrompt = newPromptBody.value.prompt;

			if (!slug) {
				return;
			}

			threads.values.push({
				id: slug,

				title: generateTitle(initialPrompt),

				messages: [
					{
						role: 'user',
						content: initialPrompt,
						id: crypto.randomUUID()
					}
				],

				status: 'loading'
			});

			await getResponseFromLLM(newPromptBody.value);

			newPromptBody.value = null;
		}
	});
</script>

<svelte:head>
	{#if thread}
		<title>{thread.title}</title>
	{:else if newPromptBody.value}
		<title>{generateTitle(newPromptBody.value.prompt)}</title>
	{:else}
		<title>{slug}</title>
	{/if}
</svelte:head>

<div class="thread-container flex h-full flex-col gap-2">
	<header class="thread-header absolute z-1 mt-2 ml-2 rounded-xl p-3 backdrop-blur-lg">
		<h2 class="font-bold">Thread {slug}</h2>
	</header>

	<div class="chat-container over flex flex-1 flex-col-reverse gap-2 overflow-y-scroll p-2">
		{#each messages.toReversed() as message (message)}
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

					<div class="chat-bubble prose prose-sm bg-base-200">{@html message.content}</div>
				</div>
			{/if}
		{/each}
	</div>

	<div class="input-group flex w-full flex-col gap-3 rounded-2xl rounded-b-none bg-base-300 p-3">
		<div class="input-field">
			<input
				type="text"
				placeholder="Enter your question here"
				class="input w-full rounded border-none bg-transparent p-0 focus:outline-none"
			/>
		</div>

		<div class="action-bar flex flex-row justify-between gap-3">
			<select class="model-selection select rounded border-none bg-transparent focus:outline-none">
				<!-- eslint-disable @typescript-eslint/no-unused-vars -->

				{#each Array(3) as _, i (i)}
					<option value={i}>Model {i + 1}</option>
				{/each}
			</select>

			<button class="btn rounded bg-transparent hover:bg-base-100"
				><Icon icon="ic:round-send" width="24" height="24" /></button
			>
		</div>
	</div>
</div>
