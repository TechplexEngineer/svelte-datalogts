<svelte:head>
	<title>Datoms</title>
	<meta name="description" content="Datoms this app stores" />
</svelte:head>



<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let datoms = data.datoms;

</script>

<div class="text-column">

	<table class="table table-striped">
		<thead>
		<tr>
			<th>Entity</th>
			<th>Attribute</th>
			<th>Value</th>
		</tr>
		</thead>
		<tbody>
		{#each datoms as datom}
			<tr>
				<td>{datom[0]}</td>
				<td>{datom[1]}</td>
				<td>{datom[2]}</td>
			</tr>
		{/each}
		</tbody>
	</table>

<!--	-->
</div>
