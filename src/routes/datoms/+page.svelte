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

	<ul>
		{#each datoms as datom}
		<li><a href="datoms/{datom}">{datom}</a></li>
		{/each}
	</ul>

</div>
