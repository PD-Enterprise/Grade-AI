<script lang="ts">
	import Icon from '@iconify/svelte';
	import { currentModel, modelList } from '$lib/stores/store.svelte';

	let isOpen: boolean = $state(false);
	let menuRef: HTMLDivElement | undefined = $state();

	function changeModel(modelName: string) {
		currentModel.value = modelName;
		isOpen = false;
	}

	function toggle() {
		isOpen = !isOpen;
	}

	let sortedModels = $derived(
		[...modelList.values].sort((a, b) => {
			if (a.modelName === currentModel.value) return -1;
			if (b.modelName === currentModel.value) return 1;
			return 0;
		})
	);

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && menuRef && !menuRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div bind:this={menuRef} class="relative">
	<button
		class="model-selector-toggle hidden items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground sm:inline-flex"
		onclick={toggle}
	>
		{currentModel.value}
		<Icon icon="lucide:chevron-down" class="h-3 w-3" />
	</button>

	<button
		class="model-selector-toggle flex items-center rounded-lg bg-secondary p-2 text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground sm:hidden"
		onclick={toggle}
	>
		<Icon icon="lucide:chevron-down" class="h-5 w-5" />
	</button>

	{#if isOpen}
		<button
			class="absolute top-full right-0 z-50 mt-2 max-h-60 min-w-48 overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
			onclick={() => {
				isOpen = false;
			}}
		>
			{#each sortedModels as model (model)}
				<button
					class={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
						currentModel.value == model.modelName
							? 'text-primary-foreground bg-primary'
							: 'text-foreground hover:bg-secondary'
					}`}
					onclick={() => {
						changeModel(model.modelName);
					}}
				>
					{model.modelName}
				</button>
			{/each}
		</button>
	{/if}
</div>
