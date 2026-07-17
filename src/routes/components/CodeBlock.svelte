<script lang="ts">
	interface Props {
		lang: string;
		text: string;
	}
	const { lang, text }: Props = $props();

	const sanitized = $derived(
		text
			.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
			.replace(/<[^>]+>/g, (m) => (m === '</span>' || /^<span\s+class="hljs-/.test(m) ? m : ''))
	);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<pre class="hljs {lang}"><code>{@html sanitized}</code></pre>
