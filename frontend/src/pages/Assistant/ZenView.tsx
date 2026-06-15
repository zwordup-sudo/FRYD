import { useState } from "react";
import type { GraphNode, GraphLink } from "./GraphView";

type ZenViewProps = {
  data: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
  onNodeSelect: (node: GraphNode) => void;
  selectedNodeId: string | null;
};

const categoryInfo = {
  diary: {
    icon: "📝",
    label: "Diarios",
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.35)",
    gradient: "from-purple-500/10 to-indigo-500/10",
    bg: "rgba(168, 85, 247, 0.08)",
    borderClass: "border-t-[5px] border-t-[#a855f7]",
    pillStyle: { bg: "rgba(168, 85, 247, 0.08)", border: "rgba(168, 85, 247, 0.2)", text: "#c084fc" }
  },
  habit: {
    icon: "⚡",
    label: "Hábitos",
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.35)",
    gradient: "from-emerald-500/10 to-teal-500/10",
    bg: "rgba(16, 185, 129, 0.08)",
    borderClass: "border-t-[5px] border-t-[#10b981]",
    pillStyle: { bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)", text: "#34d399" }
  },
  task: {
    icon: "✅",
    label: "Tareas",
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.35)",
    gradient: "from-cyan-500/10 to-blue-500/10",
    bg: "rgba(6, 182, 212, 0.08)",
    borderClass: "border-t-[5px] border-t-[#06b6d4]",
    pillStyle: { bg: "rgba(6, 182, 212, 0.08)", border: "rgba(6, 182, 212, 0.2)", text: "#22d3ee" }
  },
  concept: {
    icon: "🧠",
    label: "Conceptos",
    color: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.35)",
    gradient: "from-pink-500/10 to-rose-500/10",
    bg: "rgba(236, 72, 153, 0.08)",
    borderClass: "border-t-[5px] border-t-[#ec4899]",
    pillStyle: { bg: "rgba(236, 72, 153, 0.08)", border: "rgba(236, 72, 153, 0.2)", text: "#f472b6" }
  },
};

export default function ZenView({ data, onNodeSelect, selectedNodeId }: ZenViewProps) {
  const [modalNode, setModalNode] = useState<GraphNode | null>(null);

  // Group nodes by type
  const groupedNodes = {
    diary: data.nodes.filter((n) => n.type === "diary"),
    habit: data.nodes.filter((n) => n.type === "habit"),
    task: data.nodes.filter((n) => n.type === "task"),
    concept: data.nodes.filter((n) => n.type === "concept"),
  };

  // Helper to find connected node info
  const getConnectedPills = (nodeId: string) => {
    const connected: { label: string; node: GraphNode; type: string }[] = [];
    data.links.forEach((l) => {
      const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as any).id;

      if (sId === nodeId) {
        const targetNode = data.nodes.find((n) => n.id === tId);
        if (targetNode) connected.push({ label: targetNode.label, node: targetNode, type: l.type });
      } else if (tId === nodeId) {
        const sourceNode = data.nodes.find((n) => n.id === sId);
        if (sourceNode) connected.push({ label: sourceNode.label, node: sourceNode, type: l.type });
      }
    });

    // Remove duplicates
    const seen = new Set();
    return connected.filter((item) => {
      const duplicate = seen.has(item.node.id);
      seen.add(item.node.id);
      return !duplicate;
    });
  };

  const parseDiaryTitle = (title: string) => {
    const match = title.match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);
    if (match) {
      const dateStr = match[1];
      const rest = match[2];
      try {
        const dateObj = new Date(dateStr + "T00:00:00");
        const formattedDate = dateObj.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return {
          title: rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : "Entrada de Diario",
          subtitle: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
        };
      } catch {}
    }
    return { title, subtitle: "" };
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-6 bg-[var(--color-bg-primary)] animate-fade-in select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full align-start pb-6">
        {(Object.keys(groupedNodes) as Array<keyof typeof groupedNodes>).map((type) => {
          const info = categoryInfo[type];
          const items = groupedNodes[type];

          return (
            <div
              key={type}
              className="flex flex-col h-[calc(100vh-230px)] min-h-[460px] md:h-full rounded-2xl overflow-hidden shadow-sm"
              style={{ backgroundColor: info.bg }}
            >
              {/* Column Header */}
              <div className="px-4 pt-6 pb-4 flex flex-col items-center justify-center text-center">
                <h3 
                  className="text-xl font-bold tracking-tight mb-1 flex items-center gap-2"
                  style={{ color: info.color }}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                </h3>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--color-text-muted)]">
                  {items.length} {items.length === 1 ? "elemento" : "elementos"}
                </span>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-thin">
                {items.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  const pills = getConnectedPills(node.id);
                  const parsedDiary = node.type === "diary" ? parseDiaryTitle(node.label) : null;

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        onNodeSelect(node);
                        setModalNode(node);
                      }}
                      className={`
                        p-4 rounded-xl cursor-pointer transition-all duration-300 transform
                        hover:-translate-y-1 hover:shadow-lg shadow-md
                        bg-[var(--color-surface-card)] border-x border-b border-[var(--color-border-default)]
                        ${info.borderClass}
                        ${
                          isSelected
                            ? "ring-2 ring-[var(--color-accent-primary)] scale-[1.02]"
                            : "hover:border-[var(--color-border-accent)]"
                        }
                      `}
                    >
                      <div className="flex flex-col gap-1.5 mb-2">
                        <h4 className="text-xs font-bold text-[var(--color-text-primary)] leading-snug">
                          {node.type === "concept" 
                            ? node.label.replace("🧠 ", "") 
                            : parsedDiary 
                            ? parsedDiary.title 
                            : node.label}
                        </h4>
                        {parsedDiary && parsedDiary.subtitle && (
                          <span className="text-[9px] text-[var(--color-text-muted)] font-medium">
                            {parsedDiary.subtitle}
                          </span>
                        )}
                      </div>

                      {/* Traceable Connected Pill Badges */}
                      {pills.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/[0.04]">
                          <div className="flex flex-wrap gap-1">
                            {pills.map((pill, i) => {
                              const targetInfo = categoryInfo[pill.node.type as keyof typeof categoryInfo];
                              const style = targetInfo?.pillStyle || { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "var(--color-text-secondary)" };
                              
                              return (
                                <span
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNodeSelect(pill.node);
                                    setModalNode(pill.node);
                                  }}
                                  className="text-[8px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 hover:scale-105 transition-all shadow-sm"
                                  style={{
                                    backgroundColor: style.bg,
                                    borderColor: style.border,
                                    color: style.text
                                  }}
                                >
                                  <span>{targetInfo?.icon}</span>
                                  <span>{pill.node.type === "concept" ? pill.label.replace("🧠 ", "") : pill.label}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="h-[120px] flex flex-col items-center justify-center text-center p-4 bg-white/[0.02] rounded-xl border border-dashed border-[var(--color-border-default)]">
                    <span className="text-2xl opacity-20 mb-1">{info.icon}</span>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      Sin {info.label.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DETAIL POPUP MODAL --- */}
      {modalNode && (() => {
        const info = categoryInfo[modalNode.type as keyof typeof categoryInfo] || categoryInfo.concept;
        const parsedDiary = modalNode.type === "diary" ? parseDiaryTitle(modalNode.label) : null;
        
        return (
          <div className="modal-overlay" onClick={() => setModalNode(null)}>
            <div 
              className="modal-content card-static max-w-lg w-full relative overflow-hidden transition-all duration-300 border"
              style={{ 
                borderColor: info.color, 
                boxShadow: `0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 25px -5px ${info.glowColor}` 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ambient Background Glow Effect */}
              <div className={`absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br ${info.gradient} rounded-full blur-3xl opacity-60 -z-10`} />

              {/* Header */}
              <div className="flex items-center justify-between mb-5 border-b border-[var(--color-border-default)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                    {info.label.slice(0, -1)} {/* Singularize */}
                  </span>
                </div>
                <button onClick={() => setModalNode(null)} className="btn-ghost p-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Content */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                    {modalNode.type === "concept" 
                      ? modalNode.label.replace("🧠 ", "") 
                      : parsedDiary 
                      ? parsedDiary.title 
                      : modalNode.label}
                  </h3>
                  {parsedDiary && parsedDiary.subtitle && (
                    <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-1">
                      {parsedDiary.subtitle}
                    </p>
                  )}
                </div>

                {/* Metrics / Status Area */}
                {(modalNode.type === "task" || modalNode.type === "habit" || (modalNode.type === "diary" && modalNode.details?.energy_level !== undefined)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {modalNode.type === "task" && modalNode.details && (
                      <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Estado:</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          modalNode.details.status === "completed" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        }`}>
                          {modalNode.details.status === "completed" ? "Completado" : "Pendiente"}
                        </span>
                      </div>
                    )}

                    {modalNode.type === "habit" && modalNode.details && (
                      <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Completado:</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          🔥 {modalNode.details.completions_count || 0} veces
                        </span>
                      </div>
                    )}

                    {modalNode.type === "diary" && modalNode.details?.energy_level !== undefined && (
                      <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between col-span-1 sm:col-span-2">
                        <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Nivel de Energía:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <span 
                              key={level} 
                              className={`text-base transition-all duration-300 ${
                                level <= (modalNode.details?.energy_level || 0) 
                                  ? "text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.6)] scale-110" 
                                  : "text-white/10"
                              }`}
                            >
                              ⚡
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Description */}
                {(modalNode.details?.description || modalNode.details?.content) && (
                  <div 
                    className="relative border-l-[3px] p-4 rounded-r-xl bg-white/[0.01] border-y border-r border-[var(--color-border-default)]" 
                    style={{ borderLeftColor: info.color }}
                  >
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line font-medium">
                      {modalNode.details.description || modalNode.details.content}
                    </p>
                  </div>
                )}

                {/* Connections List */}
                {getConnectedPills(modalNode.id).length > 0 && (
                  <div className="pt-4 border-t border-[var(--color-border-default)]">
                    <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">
                      Conexiones Relacionadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getConnectedPills(modalNode.id).map((pill, i) => {
                        const targetInfo = categoryInfo[pill.node.type as keyof typeof categoryInfo];
                        const style = targetInfo?.pillStyle || { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "var(--color-text-secondary)" };
                        
                        return (
                          <span
                            key={i}
                            onClick={() => {
                              setModalNode(pill.node);
                              onNodeSelect(pill.node);
                            }}
                            className="text-[10px] px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer hover:shadow-md"
                            style={{
                              backgroundColor: style.bg,
                              borderColor: style.border,
                              color: style.text,
                              boxShadow: `0 0 12px -6px ${targetInfo?.glowColor || 'transparent'}`
                            }}
                          >
                            <span>{targetInfo?.icon}</span>
                            <span>{pill.node.type === "concept" ? pill.label.replace("🧠 ", "") : pill.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="mt-8 pt-4 border-t border-[var(--color-border-default)]">
                <button onClick={() => setModalNode(null)} className="btn-primary w-full">
                  Cerrar Detalles
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
