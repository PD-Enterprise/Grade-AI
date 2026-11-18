<script lang="ts">
	import IconChevronDown from '~icons/ic/baseline-expand-more';
	import { currentModel, modelList } from '$lib/stores/store.svelte';

	let { align = 'left', class: className = '' }: { align?: 'left' | 'right'; class?: string } =
		$props();

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

<div bind:this={menuRef} class="relative {className}">
	<button
		class="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted/40 hover:text-foreground"
		onclick={toggle}
		type="button"
	>
		<span class="max-w-[120px] truncate sm:max-w-none">{currentModel.value}</span>
		<IconChevronDown class="h-3.5 w-3.5 shrink-0 opacity-60" />
	</button>

	{#if isOpen}
		<div
			class={`absolute top-full z-50 mt-2 max-h-60 min-w-48 overflow-y-auto rounded-lg border border-border bg-card shadow-xl ${align === 'right' ? 'right-0' : 'left-0'}`}
		>
			{#each sortedModels as model (model)}
				<button
					class={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
						currentModel.value == model.modelName
							? 'text-primary-foreground bg-primary'
							: 'text-foreground hover:bg-secondary'
					}`}
					onclick={(e) => {
						e.stopPropagation();
						changeModel(model.modelName);
					}}
				>
					{model.modelName}
				</button>
			{/each}
		</div>
	{/if}
</div>
