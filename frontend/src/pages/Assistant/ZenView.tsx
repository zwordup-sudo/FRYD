import type { CSSProperties } from "react";
import type { GraphLink, GraphNode } from "./GraphView";

type ZenViewProps = {
  data: { nodes: GraphNode[]; links: GraphLink[] };
  onNodeSelect: (node: GraphNode) => void;
  selectedNodeId: string | null;
};

const categories = {
  diary: { label: "Diario", subtitle: "Reflexiones y estados", color: "#8b5cf6", icon: "M6 4h12a2 2 0 012 2v14H8a4 4 0 01-4-4V6a2 2 0 012-2zM8 4v16" },
  habit: { label: "Hábitos", subtitle: "Rutinas y constancia", color: "#14b8a6", icon: "M12 2l2.8 6.2L21 11l-6.2 2.8L12 20l-2.8-6.2L3 11l6.2-2.8z" },
  task: { label: "Tareas", subtitle: "Acciones personales", color: "#3b82f6", icon: "M9 11l3 3L22 4M21 12a9 9 0 11-5.3-8.2" },
  concept: { label: "Conceptos IA", subtitle: "Patrones detectados", color: "#6366f1", icon: "M9.5 4.5A3 3 0 006 7.5v1A3.5 3.5 0 004.5 15 3.5 3.5 0 008 18.5h1.5V4.5zM14.5 4.5A3 3 0 0118 7.5v1a3.5 3.5 0 011.5 6.5 3.5 3.5 0 01-3.5 3.5h-1.5V4.5zM12 3v18" },
  project: { label: "Proyectos", subtitle: "Espacios de trabajo", color: "#7c3aed", icon: "M3 7h7l2 2h9v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
  project_task: { label: "Tareas de proyecto", subtitle: "Trabajo conectado", color: "#38bdf8", icon: "M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01" },
} as const;

const connectedCount = (nodeId: string, links: GraphLink[]) => links.reduce((count, link) => {
  const source = typeof link.source === "string" ? link.source : link.source.id;
  const target = typeof link.target === "string" ? link.target : link.target.id;
  return count + (source === nodeId || target === nodeId ? 1 : 0);
}, 0);

const descriptionFor = (node: GraphNode) => {
  if (node.type === "concept") return "Patrón agrupado automáticamente por FRYD.";
  if (node.details?.description) return String(node.details.description);
  if (node.details?.content) return String(node.details.content);
  if (node.type === "habit" && node.details?.frequency) return `Frecuencia: ${node.details.frequency}`;
  if ((node.type === "task" || node.type === "project_task") && node.details?.status) return `Estado: ${node.details.status}`;
  return "Elemento conectado a tu cerebro digital.";
};

export default function ZenView({ data, onNodeSelect, selectedNodeId }: ZenViewProps) {
  return (
    <div className="assistant-collections-view">
      <div className="assistant-collections-grid">
        {(Object.keys(categories) as Array<keyof typeof categories>).map((type) => {
          const category = categories[type];
          const nodes = data.nodes.filter((node) => node.type === type);
          return (
            <section key={type} className="assistant-collection" style={{ "--collection-color": category.color } as CSSProperties}>
              <header className="assistant-collection-header">
                <div className="assistant-collection-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={category.icon} /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3>{category.label}</h3>
                    <span>{nodes.length}</span>
                  </div>
                  <p>{category.subtitle}</p>
                </div>
              </header>
              <div className="assistant-collection-list">
                {nodes.length === 0 ? (
                  <div className="assistant-collection-empty">Aún no hay elementos en esta colección.</div>
                ) : nodes.map((node) => {
                  const connections = connectedCount(node.id, data.links);
                  return (
                    <button
                      type="button"
                      key={node.id}
                      onClick={() => onNodeSelect(node)}
                      className={`assistant-knowledge-card ${selectedNodeId === node.id ? "is-selected" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="assistant-knowledge-dot" />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="assistant-knowledge-title">{node.label.replace(/^🧠\s*/, "")}</p>
                          <p className="assistant-knowledge-description">{descriptionFor(node)}</p>
                          <div className="assistant-knowledge-meta">
                            <span>{connections} {connections === 1 ? "conexión" : "conexiones"}</span>
                            {node.details?.due_date && <span>Vence {String(node.details.due_date).slice(0, 10)}</span>}
                          </div>
                        </div>
                        <svg className="assistant-knowledge-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
