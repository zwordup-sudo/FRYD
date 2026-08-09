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
  data: { nodes: GraphNode[]; links: GraphLink[] };
  onNodeSelect: (node: GraphNode) => void;
  selectedNodeId: string | null;
};

const typeConfig = {
  diary: { label: "Diario", color: "#8b5cf6", size: 12 },
  habit: { label: "Hábitos", color: "#14b8a6", size: 12 },
  task: { label: "Tareas", color: "#3b82f6", size: 12 },
  concept: { label: "Conceptos IA", color: "#6366f1", size: 17 },
  project: { label: "Proyectos", color: "#7c3aed", size: 16 },
  project_task: { label: "Tareas de proyecto", color: "#38bdf8", size: 11 },
} as const;

const compactLabel = (label: string) => {
  const clean = label.replace(/^🧠\s*/, "");
  return clean.length > 28 ? `${clean.slice(0, 26)}…` : clean;
};

export default function GraphView({ data, onNodeSelect, selectedNodeId }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onNodeSelectRef = useRef(onNodeSelect);

  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll("*").remove();

    const width = Math.max(containerRef.current.clientWidth || 600, 320);
    const height = Math.max(containerRef.current.clientHeight || 500, 320);
    const svg = svgElement.attr("width", "100%").attr("height", "100%").attr("viewBox", `0 0 ${width} ${height}`);

    const defs = svg.append("defs");
    const selectedGlow = defs.append("filter").attr("id", "fryd-selected-glow").attr("x", "-80%").attr("y", "-80%").attr("width", "260%").attr("height", "260%");
    selectedGlow.append("feGaussianBlur").attr("stdDeviation", "6").attr("result", "blur");
    const merge = selectedGlow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const canvas = svg.append("g").attr("class", "assistant-graph-canvas");

    // Calm orbital guides give the map spatial structure without competing with data.
    const guides = canvas.append("g").attr("class", "assistant-graph-guides").style("pointer-events", "none");
    [0.18, 0.31, 0.44].forEach((ratio, index) => {
      guides.append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", Math.min(width, height) * ratio)
        .attr("fill", "none")
        .attr("stroke", index === 0 ? "rgba(99,102,241,.08)" : "rgba(148,163,184,.045)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", index === 0 ? "4 8" : "2 10");
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 2.8])
      .on("zoom", (event) => canvas.attr("transform", event.transform));
    svg.call(zoom);

    const degrees: Record<string, number> = {};
    data.nodes.forEach((node) => { degrees[node.id] = 0; });
    data.links.forEach((link) => {
      const source = typeof link.source === "string" ? link.source : link.source.id;
      const target = typeof link.target === "string" ? link.target : link.target.id;
      if (degrees[source] !== undefined) degrees[source] += 1;
      if (degrees[target] !== undefined) degrees[target] += 1;
    });

    const nodes: GraphNode[] = data.nodes.map((node) => ({ ...node }));
    const links: GraphLink[] = data.links.map((link) => ({ ...link }));

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links).id((node) => node.id).distance((link) => link.type === "has_concept" ? 92 : 112).strength(0.7))
      .force("charge", d3.forceManyBody().strength((node: any) => node.type === "concept" ? -330 : -230))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.025))
      .force("y", d3.forceY(height / 2).strength(0.025))
      .force("collide", d3.forceCollide<GraphNode>().radius((node) => typeConfig[node.type].size + 34).iterations(2));

    const linkLayer = canvas.append("g").attr("class", "assistant-graph-links");
    const link = linkLayer.selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "rgba(148,163,184,.12)")
      .attr("stroke-width", 1.1)
      .attr("stroke-dasharray", (item) => item.type === "has_concept" ? "4 5" : null)
      .attr("stroke-linecap", "round");

    const nodeLayer = canvas.append("g").attr("class", "assistant-graph-nodes");
    const node = nodeLayer.selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "assistant-graph-node")
      .style("cursor", "pointer")
      .on("click", (event, item) => {
        if (event.defaultPrevented) return;
        onNodeSelectRef.current(item);
      });

    node.append("circle")
      .attr("r", (item) => typeConfig[item.type].size + (item.id === selectedNodeId ? 10 : 6))
      .attr("fill", (item) => item.id === selectedNodeId ? typeConfig[item.type].color : "transparent")
      .attr("opacity", (item) => item.id === selectedNodeId ? 0.18 : 0)
      .attr("filter", (item) => item.id === selectedNodeId ? "url(#fryd-selected-glow)" : null);

    node.filter((item) => item.type === "concept" || item.type === "project")
      .append("circle")
      .attr("r", (item) => typeConfig[item.type].size + 5)
      .attr("fill", "none")
      .attr("stroke", (item) => typeConfig[item.type].color)
      .attr("stroke-opacity", 0.28)
      .attr("stroke-width", 1.5);

    node.append("circle")
      .attr("r", (item) => typeConfig[item.type].size)
      .attr("fill", (item) => typeConfig[item.type].color)
      .attr("fill-opacity", (item) => item.type === "concept" ? 0.95 : 0.88)
      .attr("stroke", (item) => item.id === selectedNodeId ? "#f8fafc" : "rgba(248,250,252,.2)")
      .attr("stroke-width", (item) => item.id === selectedNodeId ? 2 : 1.2);

    node.append("circle")
      .attr("r", (item) => Math.max(2.4, typeConfig[item.type].size * 0.23))
      .attr("fill", "rgba(255,255,255,.82)")
      .style("pointer-events", "none");

    const conceptBadge = node.filter((item) => item.type === "concept" && (degrees[item.id] || 0) > 0)
      .append("g")
      .attr("transform", "translate(14,-14)")
      .style("pointer-events", "none");
    conceptBadge.append("circle").attr("r", 7.5).attr("fill", "#0d1526").attr("stroke", "#6366f1").attr("stroke-width", 1.3);
    conceptBadge.append("text").attr("text-anchor", "middle").attr("dy", "3px").attr("fill", "#c7d2fe").attr("font-size", "8px").attr("font-weight", 700).text((item) => degrees[item.id] || 0);

    node.append("text")
      .attr("dy", (item) => typeConfig[item.type].size + 17)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--color-text-secondary)")
      .attr("font-size", "10px")
      .attr("font-weight", 600)
      .attr("paint-order", "stroke")
      .attr("stroke", "rgba(8,13,24,.85)")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round")
      .style("pointer-events", "none")
      .text((item) => compactLabel(item.label));

    node.on("mouseenter", function (_event, item) {
      const connected = new Set<string>([item.id]);
      links.forEach((line) => {
        const source = typeof line.source === "string" ? line.source : (line.source as GraphNode).id;
        const target = typeof line.target === "string" ? line.target : (line.target as GraphNode).id;
        if (source === item.id) connected.add(target);
        if (target === item.id) connected.add(source);
      });
      node.transition().duration(140).style("opacity", (candidate) => connected.has(candidate.id) ? 1 : 0.22);
      link.transition().duration(140)
        .attr("stroke", (line) => {
          const source = typeof line.source === "string" ? line.source : (line.source as GraphNode).id;
          const target = typeof line.target === "string" ? line.target : (line.target as GraphNode).id;
          return source === item.id || target === item.id ? typeConfig[item.type].color : "rgba(148,163,184,.05)";
        })
        .attr("stroke-opacity", (line) => {
          const source = typeof line.source === "string" ? line.source : (line.source as GraphNode).id;
          const target = typeof line.target === "string" ? line.target : (line.target as GraphNode).id;
          return source === item.id || target === item.id ? 0.7 : 0.25;
        })
        .attr("stroke-width", (line) => {
          const source = typeof line.source === "string" ? line.source : (line.source as GraphNode).id;
          const target = typeof line.target === "string" ? line.target : (line.target as GraphNode).id;
          return source === item.id || target === item.id ? 1.8 : 1;
        });
    });

    node.on("mouseleave", () => {
      node.transition().duration(140).style("opacity", 1);
      link.transition().duration(140).attr("stroke", "rgba(148,163,184,.12)").attr("stroke-opacity", 1).attr("stroke-width", 1.1);
    });

    const drag = d3.drag<SVGGElement, GraphNode>()
      .on("start", (event, item) => {
        if (!event.active) simulation.alphaTarget(0.22).restart();
        item.fx = item.x;
        item.fy = item.y;
      })
      .on("drag", (event, item) => {
        item.fx = event.x;
        item.fy = event.y;
      })
      .on("end", (event, item) => {
        if (!event.active) simulation.alphaTarget(0);
        item.fx = null;
        item.fy = null;
      });
    node.call(drag);

    simulation.on("tick", () => {
      link
        .attr("x1", (item: any) => item.source.x)
        .attr("y1", (item: any) => item.source.y)
        .attr("x2", (item: any) => item.target.x)
        .attr("y2", (item: any) => item.target.y);
      node.attr("transform", (item: any) => `translate(${item.x},${item.y})`);
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const nextWidth = Math.max(containerRef.current.clientWidth, 320);
      const nextHeight = Math.max(containerRef.current.clientHeight, 320);
      svg.attr("viewBox", `0 0 ${nextWidth} ${nextHeight}`);
      simulation.force("center", d3.forceCenter(nextWidth / 2, nextHeight / 2));
      simulation.force("x", d3.forceX(nextWidth / 2).strength(0.025));
      simulation.force("y", d3.forceY(nextHeight / 2).strength(0.025));
      simulation.alpha(0.25).restart();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      simulation.stop();
      resizeObserver.disconnect();
    };
  }, [data, selectedNodeId]);

  return (
    <div ref={containerRef} className="assistant-graph-view">
      <svg ref={svgRef} className="w-full h-full block" aria-label="Mapa de conexiones del Cerebro Digital" />
      <div className="assistant-graph-legend">
        {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((type) => (
          <span key={type}><i style={{ backgroundColor: typeConfig[type].color }} />{typeConfig[type].label}</span>
        ))}
      </div>
      <div className="assistant-graph-tip">Scroll para zoom · arrastra para reorganizar</div>
    </div>
  );
}
