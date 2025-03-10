<script lang="ts">
	import { modalList } from '$lib/utils/modalList';
	import type { UserRole, modalType } from '$lib/types/types';
	import { userRole, selectedModal } from '$lib/stores/store';
	import { onMount } from 'svelte';

	onMount(async () => {
		const storedModal = localStorage.getItem('SelectedModal');
		selectedModal.set(storedModal as modalType['id']);
	});
	function changeModal(modal: modalType) {
		selectedModal.set(modal.id);
		localStorage.setItem('SelectedModal', modal.id);
	}
</script>

<div class="dropdown dropdown-top p-1">
	<button tabindex="0" class="flex w-64 items-center" style="color: #6B7280">
		{$selectedModal}
		<svg
			width="25px"
			height="25px"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="mt-1"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M12.7071 14.7071C12.3166 15.0976 11.6834 15.0976 11.2929 14.7071L6.29289 9.70711C5.90237 9.31658 5.90237 8.68342 6.29289 8.29289C6.68342 7.90237 7.31658 7.90237 7.70711 8.29289L12 12.5858L16.2929 8.29289C16.6834 7.90237 17.3166 7.90237 17.7071 8.29289C18.0976 8.68342 18.0976 9.31658 17.7071 9.70711L12.7071 14.7071Z"
				stroke="#6B7280"
				fill="#6B7280"
			/>
		</svg>
	</button>
	<div class="z-1 w-54 dropdown-content menu rounded-box bg-base-300 p-2 shadow-sm">
		<ul class="tabs gap-5 p-1">
			<li id="custom">
				<button
					on:click={() => {
						const customModalList = document.getElementById('custom-modals-list') as HTMLElement;
						const directModalList = document.getElementById('direct-modals-list') as HTMLElement;
						if (directModalList && customModalList) {
							customModalList.classList.remove('hidden');
							directModalList.classList.add('hidden');
						}
					}}
				>
					Custom Trained
				</button>
			</li>
			<li id="direct">
				<button
					on:click={() => {
						const directModalList = document.getElementById('direct-modals-list') as HTMLElement;
						const customModalList = document.getElementById('custom-modals-list') as HTMLElement;
						if (customModalList) {
							directModalList.classList.remove('hidden');
							customModalList.classList.add('hidden');
						}
					}}>Direct</button
				>
			</li>
		</ul>
		<div id="custom-modals-list" class="">
			{#each modalList as modal}
				{#if modal.type == 'custom'}
					{#if modal.roleRequirement.includes($userRole as UserRole)}
						<li>
							<button class="btn-ghost" on:click={() => changeModal(modal)}
								>{modal.name}
								<div class="tooltip" data-tip={modal.description}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="h-6 w-6 shrink-0 stroke-info"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
							</button>
						</li>
					{:else}
						<li>
							<button class="disabled btn-ghost"
								>{modal.name}
								<div class="tooltip" data-tip={modal.description}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="h-6 w-6 shrink-0 stroke-info"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
							</button>
						</li>
					{/if}
				{/if}
			{/each}
		</div>
		<div id="direct-modals-list" class="hidden">
			{#each modalList as modal}
				{#if modal.type == 'direct'}
					{#if modal.roleRequirement.includes($userRole as UserRole)}
						<li>
							<button class="btn-ghost" on:click={() => changeModal(modal)}
								>{modal.name}
								<div class="tooltip" data-tip={modal.description}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="h-6 w-6 shrink-0 stroke-info"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
							</button>
						</li>
					{:else}
						<li>
							<button class="disabled btn-ghost"
								>{modal.name}
								<div class="tooltip" data-tip={modal.description}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										class="h-6 w-6 shrink-0 stroke-info"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
							</button>
						</li>
					{/if}
				{/if}
			{/each}
		</div>
	</div>
</div>

<style>
	.disabled {
		cursor: not-allowed;
		color: #545c69;
	}
</style>
