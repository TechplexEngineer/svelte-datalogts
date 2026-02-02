<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let name = '';
	let query = `{
  find: ["?title"]
  where: [
    ["?e", "movie/title", "?title"]
  ]
}`;
</script>

<svelte:head>
	<title>Materialized Views</title>
</svelte:head>

<div class="text-column">
	<h1>Materialized Views</h1>

	<section class="mb-4">
		<h2>Create New View</h2>
		<form method="POST" action="?/create" use:enhance>
			<div class="form-group mb-2">
				<label for="name">View Name</label>
				<input
					type="text"
					id="name"
					name="name"
					bind:value={name}
					class="form-control"
					placeholder="All Titles"
				/>
			</div>
			<div class="form-group mb-2">
				<label for="query">HJSON Query</label>
				<textarea id="query" name="query" bind:value={query} class="form-control" rows="8" />
			</div>
			{#if form?.error}
				<div class="alert alert-danger">{form.error}</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success">View created successfully!</div>
			{/if}
			<button type="submit" class="btn btn-primary">Create View</button>
		</form>
	</section>

	<hr />

	<section>
		<h2>Existing Views</h2>
		<table class="table table-striped">
			<thead>
				<tr>
					<th>Name</th>
					<th>Table</th>
					<th>Columns</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.views as view}
					<tr>
						<td><a href="/views/{view.name}">{view.name}</a></td>
						<td><code>{view.table}</code></td>
						<td>{view.columns.join(', ')}</td>
						<td>
							<a href="/views/{view.name}/edit" class="btn btn-sm btn-secondary">Edit</a>
							<form method="POST" action="?/delete" use:enhance style="display: inline;">
								<input type="hidden" name="name" value={view.name} />
								<button type="submit" class="btn btn-sm btn-danger">Delete</button>
							</form>
						</td>
					</tr>
				{/each}
				{#if data.views.length === 0}
					<tr>
						<td colspan="4">No materialized views found.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</section>
</div>

<style>
	.mb-4 {
		margin-bottom: 2rem;
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
	}
	.btn-primary {
		background-color: #007bff;
		color: white;
	}
	.btn-danger {
		background-color: #dc3545;
		color: white;
	}
	.btn-sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
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
	.alert-success {
		color: #155724;
		background-color: #d4edda;
		border-color: #c3e6cb;
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	.table th,
	.table td {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 1px solid #dee2e6;
	}
	.table-striped tbody tr:nth-of-type(odd) {
		background-color: rgba(0, 0, 0, 0.05);
	}
</style>
