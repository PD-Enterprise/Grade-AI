<script lang="ts">
	import { modalList } from '$lib/utils/modalList';
	import type { UserRole, modalType } from '$lib/types/types';
	import { userRole, selectedModal } from '$lib/stores/store';
	import { onMount } from 'svelte';

	onMount(async () => {
		const storedModal = localStorage.getItem('SelectedModal');
		if (!storedModal) {
			localStorage.setItem('SelectedModal', $selectedModal);
		} else {
			selectedModal.set(storedModal as modalType['id']);
		}
		// console.log(storedModal);
		// console.log($selectedModal);
	});
	function changeModal(modal: modalType) {
		selectedModal.set(modal.id);
		localStorage.setItem('SelectedModal', modal.id);
	}
</script>

<div class="select-modal">
	<button
		class="btn btn-ghost h-[60px] min-h-[60px] px-4 bg-base-200 hover:bg-base-300 transition-colors duration-200"
		on:click={() => (showModal = true)}
	>
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
			<span class="text-sm font-medium">{selectedModel}</span>
		</div>
	</button>

	{#if showModal}
		<div
			class="modal modal-open"
			on:click|self={() => (showModal = false)}
		>
			<div class="modal-box bg-base-200 shadow-2xl">
				<h3 class="font-bold text-lg mb-4">Select Model</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each models as model}
						<button
							class="model-card p-4 rounded-lg bg-base-100 hover:bg-base-300 transition-all duration-200 border-2 {selectedModel === model
								? 'border-primary shadow-lg'
								: 'border-transparent hover:border-base-content/20'}"
							on:click={() => {
								selectedModel = model;
								showModal = false;
							}}
						>
							<div class="flex items-center gap-3">
								<div class="model-icon p-2 rounded-lg bg-primary/10">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6 text-primary"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<div class="text-left">
									<h4 class="font-semibold">{model}</h4>
									<p class="text-sm text-base-content opacity-70">Click to select</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
				<div class="modal-action">
					<button
						class="btn btn-ghost"
						on:click={() => (showModal = false)}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.modal-box {
		max-width: 600px;
	}

	.model-card {
		transition: all 0.2s ease-in-out;
	}

	.model-card:hover {
		transform: translateY(-2px);
	}

	.model-icon {
		transition: all 0.2s ease-in-out;
	}

	.model-card:hover .model-icon {
		transform: scale(1.1);
	}
</style>
