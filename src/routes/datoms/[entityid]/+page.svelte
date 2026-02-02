<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
</script>

<svelte:head>
	<title>Entity: {data.entityId}</title>
</svelte:head>

<div class="text-column">
	<h1>Entity: {data.entityId}</h1>

	<div class="table-container">
		<table class="table table-striped">
			<thead>
				<tr>
					<th>Attribute</th>
					<th>Value</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.datoms as datom}
					<tr>
						<td><strong>{datom[1]}</strong></td>
						<td>
							<form method="POST" action="?/updateAttribute" use:enhance class="edit-form">
								<input type="hidden" name="attr" value={datom[1]} />
								<input type="text" name="value" value={datom[2]} class="form-input" />
								<button type="submit" class="btn btn-sm btn-outline">Update</button>
							</form>
						</td>
						<td>
							<!-- We could add a delete single datom button here if needed -->
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<section class="add-attribute card mt-4">
		<h2>Add New Attribute</h2>
		<form method="POST" action="?/addAttribute" use:enhance class="horizontal-form">
			<div class="form-group">
				<input
					type="text"
					name="attr"
					placeholder="Attribute (e.g. movie/year)"
					class="form-input"
					required
				/>
			</div>
			<div class="form-group">
				<input type="text" name="value" placeholder="Value" class="form-input" required />
			</div>
			<button type="submit" class="btn btn-primary">Add</button>
		</form>
	</section>

	<div class="mt-4">
		<a href="/datoms" class="back-link">← Back to all entities</a>
	</div>
</div>

<style>
	.mt-4 {
		margin-top: 2rem;
	}
	.table-container {
		margin-top: 1rem;
	}
	.edit-form {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.form-input {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		flex-grow: 1;
	}
	.btn {
		padding: 0.25rem 0.75rem;
		cursor: pointer;
		border-radius: 4px;
	}
	.btn-sm {
		font-size: 0.8rem;
	}
	.btn-outline {
		background: transparent;
		border: 1px solid #007bff;
		color: #007bff;
	}
	.btn-outline:hover {
		background: #007bff;
		color: white;
	}
	.btn-primary {
		background-color: #007bff;
		color: white;
		border: none;
	}
	.horizontal-form {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-top: 1rem;
	}
	.card {
		padding: 1.5rem;
		border: 1px solid #eee;
		border-radius: 8px;
		background: #fafafa;
	}
	.back-link {
		color: #666;
		text-decoration: none;
	}
	.back-link:hover {
		text-decoration: underline;
	}
</style>
