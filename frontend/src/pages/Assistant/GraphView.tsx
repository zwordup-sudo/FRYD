import { useEffect, useRef } from "react";
import * as d3 from "d3";

export type GraphNode = {
  id: string;
  label: string;
  type: "diary" | "habit" | "task" | "concept" | "project" | "project_task";
  details?: any;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

export type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
};

type GraphViewProps = {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  onNodeSelect: (node: GraphNode) => void;
  selectedNodeId: string | null;
};

// Node styling configurations
const typeColors = {
  diary: "#a855f7",   // Purple
  habit: "#10b981",   // Emerald
  task: "#06b6d4",    // Cyan
  concept: "#ec4899", // Pink
  project: "#6366f1", // Indigo
  project_task: "#8b5cf6", // Violet
};

const nodeSizes = {
  diary: 12,
  habit: 12,
  task: 12,
  concept: 16,
  project: 16,
  project_task: 12,
};

export default function GraphView({ data, onNodeSelect, selectedNodeId }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous SVG content
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();

    // Get current dimensions
    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 500;

    // Create container groups
    const svg = svgElement
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("background-color", "transparent");

    // Add glowing filter for selected nodes
    const defs = svg.append("defs");
    const glowFilter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const mainGroup = svg.append("g").attr("class", "graph-container");

    // Zoom & Pan behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Calculate degree (connection count) for badges
    const degrees: Record<string, number> = {};
    data.nodes.forEach((n) => { degrees[n.id] = 0; });
    data.links.forEach((l) => {
      const sourceId = typeof l.source === "string" ? l.source : (l.source as any).id;
      const targetId = typeof l.target === "string" ? l.target : (l.target as any).id;
      if (degrees[sourceId] !== undefined) degrees[sourceId]++;
      if (degrees[targetId] !== undefined) degrees[targetId]++;
    });

    // Deep copy data to prevent mutations
    const nodes: GraphNode[] = data.nodes.map((d) => ({ ...d }));
    const links: GraphLink[] = data.links.map((d) => ({ ...d }));

    // Simulation Setup
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => nodeSizes[d.type as keyof typeof nodeSizes] + 25));

    // Render Links
    const link = mainGroup
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "rgba(255, 255, 255, 0.08)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) => (d.type === "has_concept" ? "3,3" : "0"))
      .style("transition", "stroke 0.2s, stroke-width 0.2s, opacity 0.2s");

    // Render Node groups
    const node = mainGroup
      .append("g")
      .attr("class", "nodes")
      .selectAll(".node-group")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .style("transition", "opacity 0.2s")
      .on("click", (event, d) => {
        // Prevent click trigger when dragging
        if (event.defaultPrevented) return;
        onNodeSelect(d);
      });

    // Pulse rings for Concept nodes
    const pulses = node
      .filter((d) => d.type === "concept")
      .append("circle")
      .attr("class", "pulse-ring")
      .attr("r", 16)
      .attr("fill", "none")
      .attr("stroke", typeColors.concept)
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6);

    const repeatPulse = () => {
      pulses
        .attr("r", 16)
        .attr("opacity", 0.6)
        .transition()
        .duration(2000)
        .ease(d3.easeQuadOut)
        .attr("r", 32)
        .attr("opacity", 0)
        .on("end", repeatPulse);
    };
    repeatPulse();

    // Node Circle (Glow underlay for selected node)
    node
      .append("circle")
      .attr("r", (d) => nodeSizes[d.type as keyof typeof nodeSizes] + 5)
      .attr("fill", (d) => typeColors[d.type as keyof typeof typeColors])
      .attr("opacity", (d) => (d.id === selectedNodeId ? 0.35 : 0))
      .attr("filter", (d) => (d.id === selectedNodeId ? "url(#glow)" : "none"))
      .attr("class", "glow-circle");

    // Main Node Circle
    node
      .append("circle")
      .attr("r", (d) => nodeSizes[d.type as keyof typeof nodeSizes])
      .attr("fill", (d) => typeColors[d.type as keyof typeof typeColors])
      .attr("stroke", (d) => (d.id === selectedNodeId ? "#ffffff" : "rgba(255, 255, 255, 0.2)"))
      .attr("stroke-width", (d) => (d.id === selectedNodeId ? 2.5 : 1.5))
      .style("transition", "stroke 0.2s, stroke-width 0.2s");

    // Concept Badges showing connection counts
    const conceptNodes = node.filter((d) => d.type === "concept");
    const badge = conceptNodes
      .append("g")
      .attr("class", "badge-group")
      .attr("transform", "translate(12, -12)");

    badge
      .append("circle")
      .attr("r", 7.5)
      .attr("fill", "var(--color-accent-primary)")
      .attr("stroke", "var(--color-bg-primary)")
      .attr("stroke-width", 1.5);

    badge
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "3px")
      .attr("fill", "#ffffff")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .text((d) => degrees[d.id] || 0);

    // Node Labels
    node
      .append("text")
      .attr("dy", (d) => nodeSizes[d.type as keyof typeof nodeSizes] + 16)
      .attr("text-anchor", "middle")
      .text((d) => d.label)
      .attr("fill", "var(--color-text-primary)")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .style("pointer-events", "none")
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)");

    // Hover focus effect: highlight hovered node and its connections
    node.on("mouseover", function (_event, d) {
      const connectedNodeIds = new Set<string>();
      connectedNodeIds.add(d.id);
      links.forEach((l) => {
        const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
        const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
        if (sId === d.id) connectedNodeIds.add(tId);
        if (tId === d.id) connectedNodeIds.add(sId);
      });

      node.style("opacity", (n) => (connectedNodeIds.has(n.id) ? 1.0 : 0.15));
      link
        .style("opacity", (l) => {
          const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
          const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
          return sId === d.id || tId === d.id ? 1.0 : 0.05;
        })
        .attr("stroke-width", (l) => {
          const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
          const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
          return sId === d.id || tId === d.id ? 2.5 : 1.5;
        })
        .attr("stroke", (l) => {
          const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
          const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
          return sId === d.id || tId === d.id ? typeColors[d.type as keyof typeof typeColors] : "rgba(255, 255, 255, 0.08)";
        });
    });

    node.on("mouseout", function () {
      node.style("opacity", 1.0);
      link
        .style("opacity", 1.0)
        .attr("stroke-width", 1.5)
        .attr("stroke", "rgba(255, 255, 255, 0.08)");
    });

    // Particle system moving along links
    const spawnParticle = () => {
      if (links.length === 0) return;
      const randomLink = links[Math.floor(Math.random() * links.length)];
      const source = randomLink.source as any;
      const target = randomLink.target as any;

      if (source.x === undefined || target.x === undefined) return;

      const particle = mainGroup
        .append("circle")
        .attr("class", "particle")
        .attr("r", 2.0)
        .attr("fill", typeColors[source.type as keyof typeof typeColors] || "#ffffff")
        .attr("cx", source.x)
        .attr("cy", source.y)
        .attr("opacity", 0.9)
        .style("pointer-events", "none");

      particle
        .transition()
        .duration(2500)
        .ease(d3.easeLinear)
        .attr("cx", target.x)
        .attr("cy", target.y)
        .on("end", () => {
          particle.remove();
        });
    };

    const particleInterval = d3.interval(spawnParticle, 400);

    // Drag-and-Drop behaviors
    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);

    // Update coordinates on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Resize Handler
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      svg.attr("viewBox", `0 0 ${w} ${h}`);
      simulation.force("center", d3.forceCenter(w / 2, h / 2));
      simulation.alpha(0.3).restart();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      simulation.stop();
      particleInterval.stop();
      resizeObserver.disconnect();
    };
  }, [data, selectedNodeId]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden select-none">
      <svg ref={svgRef} className="w-full h-full block" />
      
      {/* Dynamic legend */}
      <div className="absolute bottom-4 left-4 bg-[var(--color-surface-elevated)]/90 backdrop-blur-md border border-[var(--color-border-default)] p-3 rounded-xl flex flex-col gap-1.5 shadow-lg max-w-[200px] select-none">
        <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Leyenda del Cerebro</p>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: typeColors.diary }} />
          <span>Diarios</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: typeColors.habit }} />
          <span>Hábitos</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: typeColors.task }} />
          <span>Tareas</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: typeColors.concept }} />
          <span>Conceptos IA</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: typeColors.project }} />
          <span>Proyectos</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: typeColors.project_task }} />
          <span>Tareas Proj.</span>
        </div>
      </div>
    </div>
  );
}
