<script lang="ts">
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import type { ModelList } from '$lib/types';

	let modelList: ModelList[] = $state([]);
	let currentModel: string = $state('');
	let modelType: 'direct' | 'socratic' = $state('direct');
	let isModelSelectionMenuOpen: boolean = $state(true);
	let menuRef: HTMLDivElement | undefined = $state();

	function changeModel(modelName: string) {
		currentModel = modelName;
		localStorage.setItem('CurrentModel', currentModel);
		isModelSelectionMenuOpen = false;
	}
	function toggleModelSelectionMenu() {
		isModelSelectionMenuOpen = !isModelSelectionMenuOpen;
	}
	function handleClickOutside(event: MouseEvent) {
		// If menu is open and the click target is NOT the menu or its children
		if (isModelSelectionMenuOpen && menuRef && !menuRef.contains(event.target as Node)) {
			// We also check if the click was on the button that toggles it
			// to avoid double-toggling conflicts.
			const toggleButton = (event.target as HTMLElement).closest('.current-model button');
			if (!toggleButton) {
				isModelSelectionMenuOpen = false;
			}
		}
	}

	onMount(async () => {
		const response = await fetch('/', {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});
		const result = await response.json();
		// console.log(result);
		if (result.status !== 200) {
			console.log('Error fetching model list');
		}
		modelList = result.data;
		// console.log(modelList);

		const localCurrentModel = localStorage.getItem('CurrentModel');
		if (localCurrentModel) {
			changeModel(localCurrentModel);
		} else {
			changeModel(modelList[0].modelName);
		}
	});
	$effect(() => {});
</script>

<svelte:window onclick={handleClickOutside} />

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
		<div class="action-bar flex h-10 flex-row justify-between gap-3 bg-base-200">
			<div class="current-model">
				<button
					class="bg-ghost btn rounded p-2 hover:bg-base-100"
					onclick={() => {
						toggleModelSelectionMenu();
					}}
				>
					{currentModel}
				</button>
				{#if isModelSelectionMenuOpen}
					<div
						bind:this={menuRef}
						class="model-selection relative bottom-30 left-26 flex flex-col gap-2 rounded-xl bg-base-300 p-2"
						id="model-selection-menu"
					>
						<div class="model-type flex flex-row gap-2">
							<button
								class={`direct-models btn rounded underline ${modelType == 'direct' ? '' : 'btn-ghost'} hover:bg-base-100`}
								onclick={() => {
									modelType = 'direct';
								}}>Direct Model</button
							>
							<button
								class={`socratic-models btn rounded underline ${modelType != 'direct' ? '' : 'btn-ghost'} hover:bg-base-100`}
								onclick={() => {
									modelType = 'socratic';
								}}>Socratic Models</button
							>
						</div>
						<div class="model-list flex flex-col gap-2">
							{#each modelList as model (model)}
								{#if model.modelString == currentModel}
									<button
										class="btn justify-start rounded p-2"
										onclick={() => {
											changeModel(model.modelName);
										}}
									>
										{model.modelName}
									</button>
								{:else}
									<button
										class="btn justify-start rounded p-2 btn-ghost"
										onclick={() => {
											changeModel(model.modelName);
										}}
									>
										{model.modelName}
									</button>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<button class="btn rounded hover:bg-base-100"
				><Icon icon="ic:round-send" width="24" height="24" /></button
			>
		</div>
	</div>
</div>
