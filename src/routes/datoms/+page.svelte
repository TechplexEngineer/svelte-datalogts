<svelte:head>
	<title>Datoms</title>
	<meta name="description" content="Datoms this app stores" />
</svelte:head>



<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let datoms = data.datoms;
	let attrs = Array.from(data.attrs);
	attrs.unshift("id"); // prepend id the table

</script>

<div class="text-column">

	<table class="table table-striped">
		<thead>
		<tr>
			{#each attrs as attr}
			<th>{attr}</th>
				{/each}
		</tr>
		</thead>
		<tbody>

			{#each Object.entries(datoms) as [key, value]}
				<tr>
					{#each attrs as attr}
					<td>
						{#if attr == "id"}
							<a href="datoms/{key}">{value[attr]}</a>
						{:else}
							{value[attr] || ""}
						{/if}
						</td>
					{/each}
				</tr>
			{/each}


		</tbody>
	</table>

<!--	<ul>-->
<!--		{#each Object.entries(datoms) as [key, value]}-->
<!--		<li><a href="datoms/{key}">{JSON.stringify(value)}</a></li>-->
<!--		{/each}-->
<!--	</ul>-->

</div>
