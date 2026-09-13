<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Props {
		href?: string;
		title?: string;
		text?: string;
	}

	const { href = '', title = undefined, text = '' }: Props = $props();

	function isSafeHttpUrl(value: string): boolean {
		try {
			return new URL(value).protocol === 'https:';
		} catch {
			return false;
		}
	}

	const safe = $derived(isSafeHttpUrl(href));
	const proxied = $derived(safe ? `/api/image?url=${encodeURIComponent(href)}` : '');
	const caption = $derived((text || title || '').trim());

	let loaded = $state(false);
	let failed = $state(false);
	let lightbox = $state(false);

	function onLoad() {
		loaded = true;
	}
	function onError() {
		failed = true;
		loaded = true;
	}
	function open() {
		if (!failed) lightbox = true;
	}
	function close() {
		lightbox = false;
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
	function openExternal() {
		if (!href || typeof window === 'undefined') return;
		window.open(href, '_blank', 'noopener,noreferrer');
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if !safe}
	<button type="button" onclick={openExternal} class="chat-image-fallback">
		<Icon icon="lucide:external-link" class="h-3.5 w-3.5" />
		<span>{caption || href || 'Image link'}</span>
	</button>
{:else}
	<figure class="chat-image">
		{#if !loaded}
			<div class="chat-image-skeleton" aria-label="Loading image">
				<span class="loading loading-sm loading-spinner"></span>
			</div>
		{/if}
		{#if failed}
			<div class="chat-image-error">
				<Icon icon="lucide:image-off" class="h-6 w-6 opacity-60" />
				<p>{caption || 'Image unavailable'}</p>
				<button type="button" onclick={openExternal} class="chat-image-link-button"
					>Open source</button
				>
			</div>
		{:else}
			<button type="button" class="chat-image-button" onclick={open} aria-label="Expand image">
				<img
					src={proxied}
					alt={text}
					{title}
					loading="lazy"
					decoding="async"
					referrerpolicy="no-referrer"
					crossorigin="anonymous"
					class:chat-image-hidden={!loaded}
					onload={onLoad}
					onerror={onError}
				/>
			</button>
			{#if caption}
				<figcaption>{caption}</figcaption>
			{/if}
		{/if}
	</figure>

	{#if lightbox}
		<div
			class="chat-image-lightbox"
			role="dialog"
			aria-modal="true"
			aria-label={text || 'Image preview'}
			tabindex="-1"
		>
			<button type="button" class="chat-image-backdrop" onclick={close} aria-label="Close preview"
			></button>
			<div class="chat-image-lightbox-content">
				<img
					src={proxied}
					alt={text}
					{title}
					decoding="async"
					referrerpolicy="no-referrer"
					crossorigin="anonymous"
					class="mt-0 mb-0"
				/>
				<div class="chat-image-lightbox-bar">
					{#if caption}
						<span>{caption}</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.chat-image {
		margin-block: 0.75em;
		max-width: 28rem;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--card);
	}
	.chat-image-button {
		display: block;
		width: 100%;
		padding: 0;
		cursor: zoom-in;
		background: transparent;
		border: none;
	}
	.chat-image img {
		display: block;
		width: 100%;
		height: auto;
		max-height: 24rem;
		margin: 0;
		border-radius: 0;
		object-fit: contain;
		background: #0d0d0d;
	}
	.chat-image-hidden {
		display: none;
	}
	.chat-image figcaption {
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	.chat-image-skeleton {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 10rem;
		color: var(--muted-foreground);
	}
	.chat-image-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		font-size: 0.8rem;
		color: var(--muted-foreground);
	}
	.chat-image-error .chat-image-link-button {
		color: #60a5fa;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		font: inherit;
	}
	.chat-image-error .chat-image-link-button:hover {
		text-decoration: underline;
	}
	.chat-image-fallback {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: #60a5fa;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		font: inherit;
		text-align: left;
	}
	.chat-image-fallback:hover {
		text-decoration: underline;
	}
	.chat-image-lightbox {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}
	.chat-image-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		border: none;
		cursor: zoom-out;
	}
	.chat-image-lightbox-content {
		position: relative;
		max-width: min(90vw, 64rem);
		max-height: 90vh;
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		background: var(--card);
	}
	.chat-image-lightbox-content img {
		display: block;
		width: 100%;
		height: auto;
		max-height: 75vh;
		object-fit: contain;
		background: #0d0d0d;
	}
	.chat-image-lightbox-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
		color: var(--muted-foreground);
	}
	.chat-image-lightbox-bar .chat-image-lightbox-close {
		margin-left: auto;
		display: flex;
		padding: 0.25rem;
		border-radius: 0.375rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
	}
	.chat-image-lightbox-bar .chat-image-lightbox-close:hover {
		background: var(--muted);
	}
</style>
