<script lang="ts">
	import Graph from '$lib/Graph.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="container">
	<h1>Datom Graph Visualizer</h1>
	<p>
		Visual representation of entities and their relationships. Entities are nodes, and references
		between them are edges.
	</p>

	{#if data.datoms && data.datoms.length > 0}
		<Graph datoms={data.datoms} />
	{:else}
		<div class="empty-state">
			<p>
				No data found in the database. Go to the <a href="/datoms">Datoms page</a> to load example triples.
			</p>
		</div>
	{/if}
</div>

<style>
	.container {
		padding: 20px;
		max-width: 1200px;
		margin: 0 auto;
	}

	h1 {
		margin-bottom: 10px;
	}

	p {
		margin-bottom: 20px;
		color: #666;
	}

	.empty-state {
		text-align: center;
		padding: 50px;
		border: 2px dashed #ccc;
		border-radius: 8px;
		color: #666;
	}

	.empty-state a {
		color: #ff3e00;
		text-decoration: none;
	}

	.empty-state a:hover {
		text-decoration: underline;
	}
</style>
