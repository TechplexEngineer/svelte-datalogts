<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let name = data.view.name;
	let query = data.view.query;
</script>

<svelte:head>
	<title>Edit View: {data.view.name}</title>
</svelte:head>

<div class="text-column">
	<h1>Edit View: {data.view.name}</h1>
	<a href="/views">← Back to Views</a>

	<section class="mt-4">
		<form method="POST" action="?/update" use:enhance>
			<div class="form-group mb-2">
				<label for="name">View Name</label>
				<input type="text" id="name" name="name" bind:value={name} class="form-control" />
			</div>
			<div class="form-group mb-2">
				<label for="query">HJSON Query</label>
				<textarea id="query" name="query" bind:value={query} class="form-control" rows="12" />
			</div>
			{#if form?.error}
				<div class="alert alert-danger">{form.error}</div>
			{/if}
			<div class="mt-2">
				<button type="submit" class="btn btn-primary">Save Changes</button>
				<a href="/views" class="btn btn-secondary">Cancel</a>
			</div>
		</form>
	</section>
</div>

<style>
	.mt-4 {
		margin-top: 2rem;
	}
	.mt-2 {
		margin-top: 1rem;
	}
	.mb-2 {
		margin-bottom: 1rem;
	}
	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}
	.form-control {
		display: block;
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: inherit;
	}
	textarea.form-control {
		font-family: monospace;
	}
	.btn {
		padding: 0.5rem 1rem;
		cursor: pointer;
		border: none;
		border-radius: 4px;
		text-decoration: none;
		display: inline-block;
	}
	.btn-primary {
		background-color: #007bff;
		color: white;
	}
	.btn-secondary {
		background-color: #6c757d;
		color: white;
	}
	.alert {
		padding: 0.75rem 1.25rem;
		margin-bottom: 1rem;
		border-radius: 0.25rem;
		border: 1px solid transparent;
	}
	.alert-danger {
		color: #721c24;
		background-color: #f8d7da;
		border-color: #f5c6cb;
	}
</style>
