<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>View: {data.name}</title>
</svelte:head>

<div class="text-column">
	<h1>View: {data.name}</h1>
	<a href="/views">← Back to Views</a>

	<section class="mt-4">
		<table class="table table-striped">
			<thead>
				<tr>
					{#each data.columns as col}
						<th>{col}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each data.rows as row}
					<tr>
						{#each data.columns as col}
							<td>{row[col]}</td>
						{/each}
					</tr>
				{/each}
				{#if data.rows.length === 0}
					<tr>
						<td colspan={data.columns.length}>No data in view.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</section>
</div>

<style>
	.mt-4 {
		margin-top: 2rem;
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
