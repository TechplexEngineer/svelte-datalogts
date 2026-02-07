<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import * as d3 from 'd3';
	import type { Datom, DatomField } from './datalogts/src/datom';

	export let datoms: Datom[] = [];

	let svg: SVGElement;
	let width = 800;
	let height = 600;
	let searchQuery = '';
	let nodes: Node[] = [];
	let matchingNodes: Node[] = [];
	let currentMatchIndex = -1;
	let lastQuery = '';

	let svgSelection: d3.Selection<SVGElement, unknown, null, undefined>;
	let g: d3.Selection<SVGGElement, unknown, null, undefined>;
	let zoom: d3.ZoomBehavior<SVGElement, unknown>;

	interface Node extends d3.SimulationNodeDatum {
		id: string | number;
		name?: string;
		type?: 'person' | 'movie' | 'unknown';
		attributes: { [key: string]: DatomField };
	}

	interface Link extends d3.SimulationLinkDatum<Node> {
		source: string | number | Node;
		target: string | number | Node;
		label: string;
	}

	function handleSearch() {
		if (!searchQuery) {
			matchingNodes = [];
			currentMatchIndex = -1;
			updateHighlights();
			return;
		}

		if (searchQuery !== lastQuery) {
			// New search
			lastQuery = searchQuery;
			matchingNodes = nodes.filter(
				(n) =>
					String(n.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
					(n.name && n.name.toLowerCase().includes(searchQuery.toLowerCase()))
			);
			currentMatchIndex = matchingNodes.length > 0 ? 0 : -1;
		} else if (matchingNodes.length > 0) {
			// Cycle to next match
			currentMatchIndex = (currentMatchIndex + 1) % matchingNodes.length;
		}

		updateHighlights();
		centerOnCurrentMatch();
	}

	function updateHighlights() {
		// Reset all highlights
		d3.selectAll('.node-circle').attr('stroke-width', 1.5).attr('stroke', '#fff');

		// Highlight all matches with a light glow
		matchingNodes.forEach((n) => {
			d3.select(`#node-${n.id}`).attr('stroke-width', 3).attr('stroke', '#ffcc00');
		});

		// Stronger highlight for current match
		if (currentMatchIndex !== -1) {
			const activeMatch = matchingNodes[currentMatchIndex];
			d3.select(`#node-${activeMatch.id}`).attr('stroke-width', 5).attr('stroke', '#ff3e00');
		}
	}

	function centerOnCurrentMatch() {
		if (currentMatchIndex === -1) return;
		const targetNode = matchingNodes[currentMatchIndex];

		if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined) {
			const transform = d3.zoomIdentity
				.translate(width / 2, height / 2)
				.scale(1.5)
				.translate(-targetNode.x, -targetNode.y);

			svgSelection.transition().duration(750).call(zoom.transform, transform);
		}
	}

	function getNodeColor(node: Node) {
		if (node.type === 'person') return '#ff4444'; // Red
		if (node.type === 'movie') return '#4444ff'; // Blue
		return '#999'; // Default gray
	}

	onMount(() => {
		if (!datoms.length) return;

		const nodesMap = new Map<DatomField, Node>();
		const links: Link[] = [];

		// First pass: Identify all entities
		datoms.forEach(([e, a, v]) => {
			if (!nodesMap.has(e)) {
				nodesMap.set(e, { id: e, attributes: {}, type: 'unknown' });
			}
		});

		// Second pass: Populate attributes and identify links
		datoms.forEach(([e, a, v]) => {
			const node = nodesMap.get(e)!;

			// Assign type based on attributes
			if (String(a).startsWith('person/')) {
				node.type = 'person';
			} else if (String(a).startsWith('movie/')) {
				node.type = 'movie';
			}

			// Check if v is an entity ID
			if (nodesMap.has(v)) {
				links.push({
					source: e,
					target: v,
					label: a as string
				});
			} else {
				node.attributes[a as string] = v;
				if (a === ':db/ident' || a === 'person/name' || a === 'movie/title') {
					node.name = String(v);
				}
			}
		});

		nodes = Array.from(nodesMap.values());

		const simulation = d3
			.forceSimulation<Node>(nodes)
			.force(
				'link',
				d3
					.forceLink<Node, Link>(links)
					.id((d) => d.id)
					.distance(150)
			)
			.force('charge', d3.forceManyBody().strength(-300))
			.force('center', d3.forceCenter(width / 2, height / 2));

		svgSelection = d3.select(svg).attr('viewBox', [0, 0, width, height]);

		// Add zoom behavior
		g = svgSelection.append('g');
		zoom = d3
			.zoom<SVGElement, unknown>()
			.scaleExtent([0.1, 8])
			.on('zoom', (event) => {
				g.attr('transform', event.transform);
			});

		svgSelection.call(zoom);

		// Add arrow definition
		svgSelection
			.append('defs')
			.append('marker')
			.attr('id', 'arrowhead')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 20)
			.attr('refY', 0)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M0,-5L10,0L0,5')
			.attr('fill', '#999');

		const link = g
			.append('g')
			.attr('stroke', '#999')
			.attr('stroke-opacity', 0.6)
			.selectAll('line')
			.data(links)
			.join('line')
			.attr('stroke-width', 2)
			.attr('marker-end', 'url(#arrowhead)');

		const linkLabels = g
			.append('g')
			.selectAll('text')
			.data(links)
			.join('text')
			.attr('font-size', '10px')
			.attr('fill', '#666')
			.text((d) => d.label);

		const node = g
			.append('g')
			.selectAll('g')
			.data(nodes)
			.join('g')
			.attr('class', 'node-group')
			.on('click', (event, d) => {
				// Prevent navigation if we were dragging
				if (event.defaultPrevented) return;
				goto(`/datoms/${d.id}`);
			})
			.call(drag(simulation));

		node
			.append('circle')
			.attr('id', (d) => `node-${d.id}`)
			.attr('class', 'node-circle')
			.attr('r', 10)
			.attr('fill', (d) => getNodeColor(d))
			.attr('stroke', '#fff')
			.attr('stroke-width', 1.5);

		node
			.append('text')
			.attr('x', 12)
			.attr('y', 3)
			.attr('stroke', 'none')
			.attr('fill', '#333')
			.attr('font-size', '12px')
			.text((d) => d.name || d.id);

		node.append('title').text((d) => {
			const attrs = Object.entries(d.attributes)
				.map(([k, v]) => `${k}: ${v}`)
				.join('\n');
			return `ID: ${d.id}\nType: ${d.type}\n${attrs}`;
		});

		simulation.on('tick', () => {
			link
				.attr('x1', (d) => (d.source as Node).x!)
				.attr('y1', (d) => (d.source as Node).y!)
				.attr('x2', (d) => (d.target as Node).x!)
				.attr('y2', (d) => (d.target as Node).y!);

			linkLabels
				.attr('x', (d) => ((d.source as Node).x! + (d.target as Node).x!) / 2)
				.attr('y', (d) => ((d.source as Node).y! + (d.target as Node).y!) / 2);

			node.attr('transform', (d) => `translate(${d.x},${d.y})`);
		});

		function drag(simulation: d3.Simulation<Node, undefined>) {
			function dragstarted(event: any) {
				if (!event.active) simulation.alphaTarget(0.3).restart();
				event.subject.fx = event.subject.x;
				event.subject.fy = event.subject.y;
			}

			function dragged(event: any) {
				event.subject.fx = event.x;
				event.subject.fy = event.y;
			}

			function dragended(event: any) {
				if (!event.active) simulation.alphaTarget(0);
				event.subject.fx = null;
				event.subject.fy = null;
			}

			return d3.drag<any, Node>().on('start', dragstarted).on('drag', dragged).on('end', dragended);
		}

		return () => {
			simulation.stop();
		};
	});
</script>

<div class="controls">
	<div class="search-box">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search nodes..."
			on:keydown={(e) => e.key === 'Enter' && handleSearch()}
		/>
		<button on:click={handleSearch}>
			{matchingNodes.length > 0 && searchQuery === lastQuery ? 'Next' : 'Search & Center'}
		</button>
	</div>
	{#if matchingNodes.length > 0}
		<div class="results-info">
			Match {currentMatchIndex + 1} of {matchingNodes.length}
		</div>
	{/if}
	<div class="legend">
		<span class="legend-item"><span class="color-dot person-dot" /> Person</span>
		<span class="legend-item"><span class="color-dot movie-dot" /> Movie</span>
	</div>
</div>

<div class="graph-container">
	<svg bind:this={svg} {width} {height} />
</div>

<style>
	.controls {
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.search-box {
		display: flex;
		gap: 10px;
	}

	.controls input {
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		flex-grow: 1;
	}

	.controls button {
		padding: 8px 16px;
		background: #ff3e00;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		min-width: 140px;
	}

	.controls button:hover {
		background: #e63500;
	}

	.results-info {
		font-size: 0.9em;
		color: #666;
	}

	.legend {
		display: flex;
		gap: 20px;
		font-size: 0.9em;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.color-dot {
		display: inline-block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.person-dot {
		background: #ff4444;
	}

	.movie-dot {
		background: #4444ff;
	}

	:global(.node-group) {
		cursor: pointer;
	}

	:global(.node-circle) {
		transition: r 0.2s;
	}

	:global(.node-group:hover .node-circle) {
		r: 12;
	}

	.graph-container {
		width: 100%;
		height: 100%;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: #f9f9f9;
		overflow: hidden;
	}

	svg {
		display: block;
		width: 100%;
		height: 600px;
		cursor: grab;
	}

	svg:active {
		cursor: grabbing;
	}
</style>
