<script>
	import config from '$lib/utils/apiConfig';
	import { onMount } from 'svelte';

	async function sendMessage() {
		const inputAreaElement = document.getElementById('userInput');
		console.log(inputAreaElement);
		const response = await fetch(`${config.apiUrl}ai/chat/query`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: localStorage.getItem('Email'), prompt: 'Hello There. ' })
		});
		const result = await response.json();
		console.log(result);
	}
</script>

<svelte:head>
	<title>Grade AI - Chat</title>
</svelte:head>

<div class="main">
	<div class="side-bar"></div>
	<div class="content">
		<div class="chatlog" id="chatlog"></div>
		<div class="input-area">
			<textarea class="userInput" placeholder="Enter a prompt here..." rows="1" id="userInput"
			></textarea>
			<div class="tooltip" data-tip="Send">
				<button type="button" class="btn" on:click={sendMessage}
					><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="30px" fill="grey"
						><!--!Font Awesome Free 6.7.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
							d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"
						/></svg
					></button
				>
			</div>
		</div>
	</div>
</div>

<style>
	textarea {
		min-height: 10px;
		max-height: 60px;
		height: 45px;
		min-width: 200px;
		max-width: 75vw;
		width: 75vw;
		/* border: none; */
		padding-left: 5px;
		padding-right: 5px;
		resize: none;
		overflow-y: scroll;
		background-color: transparent;
	}
	textarea:focus {
		outline: none;
		border: none;
	}
	.input-area {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		justify-content: center;
		align-items: center;
		gap: 10px;
	}
</style>
