<div class="side-bar flex overflow-hidden p-1" id="side-bar">
	<div class="content h-screen">
		<div class="title"><p class="text-2xl">Grade AI</p></div>
		<div class="conversations mt-2 w-full flex-row flex-wrap gap-3 overflow-y-scroll p-2">
			<li class="conversation btn btn-ghost flex w-full list-none overflow-hidden border-r-4 p-1">
				<svg
					width="20px"
					height="20px"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M17 3.33782C15.5291 2.48697 13.8214 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22C17.5228 22 22 17.5228 22 12C22 10.1786 21.513 8.47087 20.6622 7"
						stroke="#6B7280"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
					<path
						d="M8 12H8.009M11.991 12H12M15.991 12H16"
						stroke="#6B7280"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<p class="flex-grow">Conversation 1</p>
			</li>
		</div>
		<div class="login-button">
			<button class="w-full p-2">Login</button>
		</div>
	</div>
</div>

<style>
	.side-bar {
		min-width: 180px;
		width: 18vw;
		max-width: 17rem;
		height: 100vh;
		background-color: var(--base-300);
		border-right: 1px solid #6b7280;
		backdrop-filter: blur(30px);
	}
	.conversations {
		height: calc(100vh - 100px);
		width: 100vw;
	}
	.login-button {
		position: absolute;
		bottom: 0;
		width: calc(100% - 8px);
	}
	.login-button button {
		text-align: left;
		height: 60px;
	}
	.conversation {
		height: 35px;
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.conversation p {
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
	}
</style>
