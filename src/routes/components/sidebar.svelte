<div class="sidebar flex h-full flex-col gap-2">
	<header class="header self-center">
		<a class="btn rounded text-xl font-bold text-white btn-ghost btn-accent" href="/">Grade AI</a>
	</header>
	<div class="list flex-1 overflow-y-scroll">
		{#each Array(100) as _, i}
			<span>This is a thread name</span>
		{/each}
	</div>
	<div class="auth flex flex-col justify-end">
		<button class="btn rounded btn-accent">Login</button>
	</div>
</div>
