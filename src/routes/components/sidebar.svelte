<div class="sidebar flex h-full flex-col gap-2">
	<header class="header self-center">
		<a class="btn rounded text-xl font-bold text-white btn-ghost btn-accent" href="/">Grade AI</a>
	</header>
	<div class="list flex flex-1 flex-col gap-1 overflow-y-scroll">
		{#each Array(20) as _, i}
			<a href={`/chat/${i + 1}`} class="btn h-7 justify-start rounded btn-ghost hover:bg-base-100"
				>This is thread {i + 1}</a
			>
		{/each}
	</div>
	<div class="auth flex flex-col justify-end">
		<button class="btn rounded bg-base-300 hover:bg-base-100">Login</button>
	</div>
</div>
