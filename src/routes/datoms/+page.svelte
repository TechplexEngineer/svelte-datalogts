<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData;

	$: datoms = data.datoms;
	$: attrs = Array.from(data.attrs);

	let newJson = '{\n  "name": "New Entity",\n  "type": "example"\n}';
	let queryStr = '';

	export const snapshot = {
		capture: () => ({ queryStr, newJson }),
		restore: (values: any) => {
			queryStr = values.queryStr;
			newJson = values.newJson;
		}
	};
</script>

<svelte:head>
	<title>Datoms</title>
	<meta name="description" content="Datoms this app stores" />
</svelte:head>

<div class="text-column">
	<h1>Datom Entities</h1>

	<section class="mb-4">
		<h2>Add New Entity</h2>
		<form method="POST" action="?/create" use:enhance>
			<div class="form-group mb-2">
				<label for="json">JSON Data (key-value pairs)</label>
				<textarea
					id="json"
					name="json"
					bind:value={newJson}
					class="form-control"
					rows="5"
					placeholder={'{"name": "John", "age": 30}'}
				/>
			</div>
			{#if form?.error}
				<div class="alert alert-danger">{form.error}</div>
			{/if}
			{#if form?.success}
				<div class="alert alert-success">Successfully added!</div>
			{/if}
			<button type="submit" class="btn btn-primary">Add Entity</button>
		</form>

		<form method="POST" action="?/loadExamples" use:enhance class="mt-2">
			<button type="submit" class="btn btn-secondary">Load Example Movies/People</button>
		</form>
	</section>

	<section class="mb-4">
		<h2>HJSON Query</h2>
		<form method="POST" action="?/query" use:enhance>
			<div class="form-group mb-2">
				<label for="query">Query (HJSON format)</label>
				<textarea
					id="query"
					name="query"
					bind:value={queryStr}
					class="form-control"
					rows="8"
					placeholder={`{
  find: ["?title"]
  where: [
    ["?e", "movie/title", "?title"]
  ]
}`}
				/>
			</div>
			{#if form?.queryError}
				<div class="alert alert-danger">{form.queryError}</div>
			{/if}
			<button type="submit" class="btn btn-primary">Run Query</button>
		</form>

		{#if form?.queryResults}
			<div class="mt-4">
				<h3>Query Results</h3>
				<pre class="bg-light p-3">{JSON.stringify(form.queryResults, null, 2)}</pre>
			</div>
		{/if}
	</section>

	<hr />

	<table class="table table-striped">
		<thead>
			<tr>
				<th>id</th>
				{#each attrs as attr}
					<th>{attr}</th>
				{/each}
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each Object.entries(datoms) as [key, value]}
				<tr>
					<td><a href="datoms/{key}">{value.id}</a></td>
					{#each attrs as attr}
						<td>
							{value[attr] || ''}
						</td>
					{/each}
					<td>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="eid" value={key} />
							<button type="submit" class="btn btn-sm btn-danger">Delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.mb-4 {
		margin-bottom: 2rem;
	}
	.mb-2 {
		margin-bottom: 1rem;
	}
	.form-control {
		display: block;
		width: 100%;
		padding: 0.5rem;
		font-family: monospace;
	}
	.btn {
		padding: 0.5rem 1rem;
		cursor: pointer;
	}
	.mt-2 {
		margin-top: 1rem;
	}
	.btn-primary {
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
	}
	.btn-secondary {
		background-color: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
	}
	.btn-danger {
		background-color: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
	}
	.btn-sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}
	.alert {
		padding: 0.75rem 1.25rem;
		margin-bottom: 1rem;
		border: 1px solid transparent;
		border-radius: 0.25rem;
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
	.mt-4 {
		margin-top: 2rem;
	}
	.bg-light {
		background-color: #f8f9fa;
	}
	.p-3 {
		padding: 1rem;
	}
</style>
