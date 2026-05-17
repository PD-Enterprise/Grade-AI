<script lang="ts">
	import { updateUserAcademicLevel } from '$lib/api/updateUserAcademicLevel';
	import { userData } from '$lib/stores/store.svelte';
	import { validateAcademicLevel } from '$lib/utils/validateAcademicLevel';
	import { onMount } from 'svelte';

	let isK_12: string = $state('true');
	let academicLevel: string = $state('');
	let academicLevelError: boolean = $state(false);

	onMount(() => {
		const dialog = document.getElementById('onboarding_modal') as HTMLDialogElement;
		dialog.showModal();
	});
	$effect(() => {
		if (academicLevel != '') {
			if (!validateAcademicLevel(academicLevel)) {
				academicLevelError = true;
			} else {
				academicLevelError = false;
			}
		}
	});
</script>

<dialog id="onboarding_modal" class="modal">
	<div class="modal-box rounded-xl bg-black">
		<form method="dialog">
			<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm">✕</button>
		</form>
		<h3 class="text-lg font-bold">Hello {userData.value.name}, Welcome to Grade AI!</h3>
		<p class="text-muted-foreground">Please select your academic level below:</p>
		<div class="academicLevel mt-5 flex flex-row gap-5">
			<select class="select-bordered metadata-input-field select" bind:value={isK_12} required>
				<option value="true">K-12</option>
				<option value="false">Not K-12</option>
			</select>
			{#if isK_12 == 'true'}
				<input
					type="text"
					class="input-bordered metadata-input-field input"
					required
					bind:value={academicLevel}
					placeholder="Academic Level"
				/>
			{:else}
				<select
					class="select-bordered metadata-input-field select"
					bind:value={academicLevel}
					required
				>
					<option value="13">Undergraduate (UG)</option>
					<option value="14">Graduate (G)</option>
					<option value="15">Postgraduate (PG)</option>
				</select>
			{/if}
		</div>
		{#if academicLevelError}
			<p class="mt-2 text-red-500">Please enter a valid academic level.</p>
		{/if}
		<form method="dialog">
			<button
				class="btn mt-2 hover:text-black hover:btn-accent"
				onclick={async () =>
					await updateUserAcademicLevel(userData.value.email, parseInt(academicLevel))}
				>Continue</button
			>
		</form>
	</div>
</dialog>
