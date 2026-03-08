<script lang="ts">
	import Icon from '@iconify/svelte';
</script>

<div class="new-chat flex h-full flex-col items-center justify-center gap-5">
	<div class="welcome-title">
		<h1 class="text-4xl font-bold">Welcome to Grade AI</h1>
	</div>
	<div class="input-group flex w-[60%] flex-col gap-3 rounded-2xl bg-base-200 p-3">
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
