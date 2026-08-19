import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  sendChatMessageStream,
  getProviders,
  getConversations,
  getConversation,
  deleteConversation,
  testProviderConnection,
  getAssistantGraph,
  getAssistantInsights,
  updateUserSettings,
} from "../../services/api";
import GraphView from "./GraphView";
import type { GraphNode, GraphLink } from "./GraphView";
import ZenView from "./ZenView";

// ── Types ──────────────────────────────────────────────────────────

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ProviderOption = {
  id: string;
  name: string;
  description: string;
  requires_api_key: boolean;
  available_models: string[];
  is_local: boolean;
  has_system_key?: boolean;
};

type ConversationItem = {
  id: number;
  title: string | null;
  provider: string;
  message_count: number;
  created_at: string;
};

type InsightItem = {
  icon: string;
  title: string;
  description: string;
  type: "success" | "warning" | "info" | "tip";
};

const providerIcons: Record<string, string> = {
  ollama: "🦙",
  openai: "🤖",
  anthropic: "🧠",
  gemini: "✨",
};

// ── Persistent storage helpers ─────────────────────────────────────

const STORAGE_KEY = "fryd_assistant_prefs";

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const savePrefs = (prefs: Record<string, string | null>) => {
  try {
    const existing = loadPrefs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...prefs }));
  } catch {
    // Silent fail
  }
};

// ── Insight card color mapping ─────────────────────────────────────

const insightStyles: Record<string, { bg: string; border: string; text: string }> = {
  success: {
    bg: "rgba(52, 211, 153, 0.08)",
    border: "rgba(52, 211, 153, 0.25)",
    text: "var(--color-accent-success)",
  },
  warning: {
    bg: "rgba(251, 191, 36, 0.08)",
    border: "rgba(251, 191, 36, 0.25)",
    text: "var(--color-accent-warning)",
  },
  info: {
    bg: "rgba(96, 165, 250, 0.08)",
    border: "rgba(96, 165, 250, 0.25)",
    text: "var(--color-accent-info)",
  },
  tip: {
    bg: "rgba(167, 139, 250, 0.08)",
    border: "rgba(167, 139, 250, 0.25)",
    text: "var(--color-accent-secondary)",
  },
};

// ── Main Component ─────────────────────────────────────────────────

export default function AssistantPage() {
  // Load persisted preferences
  const prefs = loadPrefs();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(prefs.provider || "ollama");
  const [selectedModel, setSelectedModel] = useState<string | null>(prefs.model || null);
  const [apiKey, setApiKey] = useState(prefs.apiKey || "");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Graph states
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingGraph, setIsLoadingGraph] = useState(true);
  const [viewMode, setViewMode] = useState<"creative" | "zen">("creative");
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({
    diary: true,
    habit: true,
    task: true,
    concept: true,
    project: true,
    project_task: true,
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredGraphData = useMemo(() => {
    const nodes = graphData.nodes.filter((n) => visibleTypes[n.type]);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = graphData.links.filter((l) => {
      const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
      const tId = typeof l.target === "string" ? l.target : (l.target as any).id;
      return nodeIds.has(sId) && nodeIds.has(tId);
    });
    return { nodes, links };
  }, [graphData, visibleTypes]);

  // Insights states
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    loadProviders();
    loadConversations();
    loadGraph();
    loadInsights();
  }, []);

  // Persist provider prefs whenever they change
  useEffect(() => {
    savePrefs({ provider: selectedProvider, model: selectedModel, apiKey });
  }, [selectedProvider, selectedModel, apiKey]);

  const loadGraph = async () => {
    setIsLoadingGraph(true);
    try {
      const data = await getAssistantGraph();
      setGraphData(data);
    } catch {
      setErrorMessage("Error al cargar el cerebro digital");
    } finally {
      setIsLoadingGraph(false);
    }
  };

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const data = await getAssistantInsights();
      setInsights(data);
    } catch {
      // Silent - insights are non-critical
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await getProviders();
      setProviders(data);
    } catch {
      setProviders([
        { id: "ollama", name: "Ollama (Local)", description: "Modelo local con Ollama", requires_api_key: false, available_models: ["llama3", "mistral"], is_local: true, has_system_key: false },
        { id: "openai", name: "OpenAI", description: "GPT-4, GPT-3.5", requires_api_key: true, available_models: ["gpt-4o-mini", "gpt-4o"], is_local: false, has_system_key: false },
        { id: "anthropic", name: "Anthropic", description: "Claude", requires_api_key: true, available_models: ["claude-sonnet-4-20250514"], is_local: false, has_system_key: false },
        {id: "gemini", name: "Google Gemini", description: "Gemini Pro", requires_api_key: true, available_models: ["gemini-1.5-flash", "gemini-1.5-pro"], is_local: false, has_system_key: false },
      ]);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch {
      // Silent fail
    }
  };

  const loadConversation = async (convId: number) => {
    try {
      const data = await getConversation(convId);
      setConversationId(convId);
      setSelectedProvider(data.provider || "ollama");
      setMessages(
        data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      );
      setShowHistoryPanel(false);
      setSelectedNode(null);
    } catch {
      setErrorMessage("Error al cargar la conversación");
    }
  };

  const handleDeleteConversation = async (convId: number) => {
    if (!confirm("¿Eliminar esta conversación?")) return;
    try {
      await deleteConversation(convId);
      if (conversationId === convId) {
        startNewConversation();
      }
      loadConversations();
    } catch {
      setErrorMessage("Error al eliminar conversación");
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setErrorMessage("");
    setSelectedNode(null);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setErrorMessage("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    let messagePayload = text;
    if (selectedNode) {
      messagePayload = `[CONEXIÓN CEREBRO: Analizando nodo de tipo "${selectedNode.type}" llamado "${selectedNode.label}". Detalles: ${JSON.stringify(selectedNode.details)}]\n\nPregunta sobre este nodo:\n${text}`;
    }

    const assistantMsgId = Date.now() + 1;
    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);

    try {
      const currentProvider = providers.find((p) => p.id === selectedProvider);
      await sendChatMessageStream(
        {
          message: messagePayload,
          provider: selectedProvider,
          model: selectedModel,
          api_key: currentProvider?.requires_api_key ? apiKey || null : null,
          conversation_id: conversationId,
        },
        (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        },
        (info) => {
          if (!conversationId) {
            setConversationId(info.conversation_id);
          }
        },
        (done) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, id: done.id, timestamp: new Date(done.created_at) }
                : msg
            )
          );
          loadConversations();
          setIsTyping(false);
        },
        (error) => {
          setErrorMessage(error);
          setIsTyping(false);
          setMessages((prev) => {
            const assistantMsg = prev.find((m) => m.id === assistantMsgId);
            if (assistantMsg && !assistantMsg.content) {
              return prev.filter((m) => m.id !== assistantMsgId);
            }
            return prev;
          });
        }
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Error al comunicarse con el asistente");
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    try {
      const currentProvider = providers.find((p) => p.id === selectedProvider);
      const result = await testProviderConnection({
        provider: selectedProvider,
        api_key: currentProvider?.requires_api_key ? apiKey || null : null,
        model: selectedModel,
      });
      setConnectionStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    } catch {
      setConnectionStatus("❌ Error al probar la conexión");
    }
  };

  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const icon = providerIcons[selectedProvider] || "🤖";

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  // Filtered conversations for search
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) =>
        (c.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="assistant-page animate-fade-in h-full flex flex-col">
      {/* FRYD Intelligence header */}
      <header className="assistant-topbar flex-shrink-0">
        <div className="assistant-title-group">
          <div className="assistant-brain-mark" aria-hidden="true">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 4.5A3 3 0 006 7.5v1A3.5 3.5 0 004.5 15 3.5 3.5 0 008 18.5h1.5V4.5z" />
              <path d="M14.5 4.5A3 3 0 0118 7.5v1a3.5 3.5 0 011.5 6.5 3.5 3.5 0 01-3.5 3.5h-1.5V4.5z" />
              <path d="M9.5 9H7.8M14.5 9h1.7M9.5 14H8M14.5 14H16M12 3v18" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="fryd-section-label">Inteligencia FRYD</p>
              <span className="assistant-live-pill"><span className="status-dot status-dot-active" /> En línea</span>
            </div>
            <h1 className="assistant-page-title">Cerebro Digital</h1>
            <p className="assistant-page-subtitle">Explora las conexiones entre lo que haces, piensas y construyes.</p>
          </div>
        </div>

        <div className="assistant-toolbar">
          {!isLoadingGraph && graphData.nodes.length > 0 && (
            <div className="assistant-view-switch" aria-label="Modo de visualización">
              <button
                type="button"
                onClick={() => setViewMode("creative")}
                className={viewMode === "creative" ? "is-active" : ""}
                title="Mapa de conexiones"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/></svg>
                <span>Mapa</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("zen")}
                className={viewMode === "zen" ? "is-active" : ""}
                title="Vista por colecciones"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                <span>Colecciones</span>
              </button>
            </div>
          )}

          {!isLoadingGraph && graphData.nodes.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`assistant-icon-button ${Object.values(visibleTypes).includes(false) ? "is-active" : ""}`}
                title="Filtrar elementos"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
              </button>
              {showFilterDropdown && (
                <div className="assistant-filter-popover">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="fryd-section-label">Visibilidad</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">Elige qué vive en el mapa.</p>
                    </div>
                    <button type="button" className="btn-ghost p-1.5" onClick={() => setShowFilterDropdown(false)} aria-label="Cerrar filtros">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { type: "diary", label: "Diario", dot: "assistant-dot-diary" },
                      { type: "habit", label: "Hábitos", dot: "assistant-dot-habit" },
                      { type: "task", label: "Tareas", dot: "assistant-dot-task" },
                      { type: "concept", label: "Conceptos IA", dot: "assistant-dot-concept" },
                      { type: "project", label: "Proyectos", dot: "assistant-dot-project" },
                      { type: "project_task", label: "Tareas de proyecto", dot: "assistant-dot-project-task" },
                    ].map((item) => (
                      <label key={item.type} className="assistant-filter-row">
                        <span className={`assistant-filter-dot ${item.dot}`} />
                        <span className="flex-1">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={visibleTypes[item.type]}
                          onChange={() => setVisibleTypes({ ...visibleTypes, [item.type]: !visibleTypes[item.type] })}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="button" onClick={loadGraph} className="assistant-icon-button" title="Actualizar cerebro">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.2 9A7 7 0 006.1 6.3L4 11M5.8 15A7 7 0 0017.9 17.7L20 13"/></svg>
          </button>
          <button type="button" onClick={() => setShowHistoryPanel(!showHistoryPanel)} className={`assistant-icon-button ${showHistoryPanel ? "is-active" : ""}`} title="Historial">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>
          </button>
          <button type="button" onClick={startNewConversation} className="assistant-icon-button" title="Nueva conversación">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
          </button>
          <button type="button" onClick={() => setShowChatPanel(!showChatPanel)} className={`assistant-chat-toggle ${showChatPanel ? "is-active" : ""}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z"/></svg>
            <span>FRYD AI</span>
          </button>
          <button type="button" onClick={() => setShowProviderModal(true)} className="assistant-provider-chip" title="Configurar proveedor de IA">
            <span>{icon}</span>
            <span className="hidden xl:inline truncate max-w-[120px]">{currentProvider?.name || selectedProvider}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      </header>

      <div className="assistant-shell flex-1 min-h-0">
        {/* Conversation history */}
        {showHistoryPanel && (
          <aside className="assistant-history-panel animate-slide-in-left">
            <div className="assistant-panel-header">
              <div>
                <p className="fryd-section-label">Memoria de chat</p>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">Conversaciones</h2>
              </div>
              <button type="button" onClick={startNewConversation} className="assistant-mini-action" title="Nuevo chat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
            <div className="px-3 pb-3">
              <div className="assistant-search-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar conversación" />
              </div>
            </div>
            <div className="assistant-history-list">
              {filteredConversations.map((conv) => (
                <button
                  type="button"
                  key={conv.id}
                  className={`assistant-history-item group ${conversationId === conv.id ? "is-active" : ""}`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <span className="assistant-history-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z"/></svg>
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="block truncate text-xs font-medium">{conv.title || "Sin título"}</span>
                    <span className="block text-[10px] text-[var(--color-text-muted)] mt-0.5">{conv.message_count} mensajes</span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); handleDeleteConversation(conv.id); } }}
                    className="assistant-history-delete"
                    aria-label="Eliminar conversación"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </span>
                </button>
              ))}
              {filteredConversations.length === 0 && (
                <div className="assistant-panel-empty">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z"/></svg>
                  <p>{searchQuery ? "No encontramos coincidencias." : "Tus conversaciones aparecerán aquí."}</p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Knowledge workspace */}
        <main className="assistant-brain-stage">
          {!isLoadingGraph && graphData.nodes.length > 0 && (
            <div className="assistant-stage-hud">
              <div className="assistant-stage-meta">
                <span className="assistant-stage-kicker">{viewMode === "creative" ? "Mapa de conocimiento" : "Colecciones de conocimiento"}</span>
                <span className="assistant-stage-divider" />
                <span><strong>{filteredGraphData.nodes.length}</strong> elementos</span>
                <span><strong>{filteredGraphData.links.length}</strong> conexiones</span>
              </div>
              <div className="assistant-stage-hint hidden lg:flex">
                {viewMode === "creative" ? "Arrastra · acerca · explora" : "Selecciona una tarjeta para contextualizar a FRYD"}
              </div>
            </div>
          )}

          <div className="assistant-brain-canvas">
            {isLoadingGraph ? (
              <div className="assistant-loading-state">
                <div className="assistant-orbit-loader"><span /><span /><span /></div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Conectando tus ideas</p>
                <p className="text-xs text-[var(--color-text-muted)]">FRYD está reconstruyendo tu mapa personal.</p>
              </div>
            ) : graphData.nodes.length === 0 ? (
              <div className="assistant-empty-brain">
                <div className="assistant-empty-symbol">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/></svg>
                </div>
                <p className="fryd-section-label">Primeras conexiones</p>
                <h2>Tu cerebro digital crece contigo.</h2>
                <p>Crea actividad en FRYD y aquí aparecerán relaciones entre tareas, hábitos, proyectos y reflexiones.</p>
                <div className="assistant-empty-actions">
                  <a href="/task">Crear tarea</a>
                  <a href="/habit">Crear hábito</a>
                  <a href="/diary">Escribir en diario</a>
                </div>
              </div>
            ) : viewMode === "creative" ? (
              <GraphView
                data={filteredGraphData}
                onNodeSelect={(node) => {
                  setSelectedNode(node);
                  setShowDetailModal(true);
                }}
                selectedNodeId={selectedNode?.id || null}
              />
            ) : (
              <ZenView data={filteredGraphData} onNodeSelect={(node) => setSelectedNode(node)} selectedNodeId={selectedNode?.id || null} />
            )}
          </div>
        </main>

        {/* FRYD AI context panel */}
        {showChatPanel && (
          <aside className="assistant-chat-panel animate-slide-in-right">
            <div className="assistant-chat-header">
              <div className="flex items-center gap-3 min-w-0">
                <div className="assistant-ai-avatar">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">FRYD AI</h2>
                    <span className="assistant-ai-status">Contextual</span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] truncate">{currentProvider?.name || selectedProvider}{selectedModel ? ` · ${selectedModel}` : ""}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowChatPanel(false)} className="assistant-mini-action" aria-label="Ocultar chat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {selectedNode ? (
              <div className="assistant-context-card">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`assistant-context-dot assistant-dot-${selectedNode.type.replace("_", "-")}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="fryd-section-label">Contexto activo</span>
                      <button type="button" onClick={() => setSelectedNode(null)} className="assistant-context-clear">Quitar</button>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1 truncate">{selectedNode.label}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                      {selectedNode.type === "concept"
                        ? "Concepto conectado por FRYD a elementos relacionados."
                        : selectedNode.details?.description || selectedNode.details?.content || "FRYD usará este elemento como contexto para la conversación."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="assistant-context-placeholder">
                <div className="assistant-context-mini-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/></svg>
                </div>
                <p><strong>Sin contexto fijado.</strong> Selecciona un elemento del cerebro para conversar sobre él.</p>
              </div>
            )}

            <div className="assistant-message-stream">
              {errorMessage && <div className="alert alert-error text-xs mb-3">{errorMessage}</div>}

              {messages.length === 0 && (
                <div className="assistant-chat-welcome">
                  <div>
                    <p className="fryd-section-label">Lectura FRYD</p>
                    <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] mt-1.5">
                      {selectedNode ? "Profundiza en esta conexión" : "Tu información ya tiene contexto"}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                      {selectedNode
                        ? "Pregunta, relaciona o transforma este elemento usando tu información de FRYD."
                        : "Puedo ayudarte a encontrar patrones entre tus hábitos, tareas, proyectos y reflexiones."}
                    </p>
                  </div>

                  {!isLoadingInsights && insights.length > 0 && (
                    <div className="assistant-insight-stack">
                      {insights.slice(0, 3).map((insight, i) => {
                        const style = insightStyles[insight.type] || insightStyles.info;
                        return (
                          <button type="button" key={`${insight.title}-${i}`} className="assistant-insight-card" onClick={() => handleQuickQuestion(`Profundiza en este insight: ${insight.title}. ${insight.description}`)}>
                            <span className="assistant-insight-icon" style={{ color: style.text }}>{insight.icon}</span>
                            <span className="min-w-0 text-left">
                              <span className="block text-xs font-semibold text-[var(--color-text-primary)]">{insight.title}</span>
                              <span className="block text-[10px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{insight.description}</span>
                            </span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Ideas para empezar</p>
                    <div className="assistant-suggestion-grid">
                      {(selectedNode
                        ? ["¿Qué patrón ves aquí?", "¿Con qué se relaciona?", "¿Cuál sería el siguiente paso?"]
                        : ["¿Qué debería priorizar hoy?", "¿Cómo mejorar mi constancia?", "Encuentra un patrón en mis datos"]
                      ).map((suggestion) => (
                        <button type="button" key={suggestion} onClick={() => handleQuickQuestion(suggestion)}>{suggestion}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`assistant-message-row ${msg.role === "user" ? "is-user" : "is-assistant"}`}>
                  {msg.role === "assistant" && <div className="assistant-message-avatar">F</div>}
                  <div className={`assistant-message-bubble ${msg.role === "user" ? "is-user" : "is-assistant"}`}>
                    {msg.role === "assistant" ? <div className="prose-fryd"><ReactMarkdown>{msg.content}</ReactMarkdown></div> : <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                    <span className="assistant-message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="assistant-message-row is-assistant">
                  <div className="assistant-message-avatar">F</div>
                  <div className="assistant-message-bubble is-assistant assistant-typing-bubble"><span /><span /><span /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="assistant-composer">
              <div className="assistant-composer-box">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedNode ? `Pregunta sobre ${selectedNode.label}…` : "Pregunta algo a FRYD…"}
                  rows={1}
                  disabled={isTyping}
                />
                <div className="assistant-composer-footer">
                  <span>{selectedNode ? "Usando contexto del cerebro" : "Enter para enviar · Shift+Enter para salto"}</span>
                  <button type="button" onClick={handleSend} disabled={!input.trim() || isTyping} className="assistant-send-button" aria-label="Enviar mensaje">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
                  </button>
                </div>
              </div>
              <p className="assistant-composer-note">FRYD puede equivocarse. Valida decisiones importantes.</p>
            </div>
          </aside>
        )}
      </div>

      {/* Provider Selector Modal */}
      {showProviderModal && (
        <div className="modal-overlay" onClick={() => setShowProviderModal(false)}>
          <div className="modal-content card-static max-w-md assistant-provider-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Configurar FRYD AI</h2>
              <button onClick={() => setShowProviderModal(false)} className="btn-ghost p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)] mb-3">Proveedor de IA</p>
            <div className="space-y-2 mb-4">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setSelectedModel(null);
                    setConnectionStatus(null);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-3.5 rounded-xl text-left
                    transition-all duration-200 border
                    ${
                      selectedProvider === provider.id
                        ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary-glow)]"
                        : "border-[var(--color-border-default)] bg-[var(--color-surface-input)] hover:border-[var(--color-border-accent)]"
                    }
                  `}
                >
                  <span className="text-xl">{providerIcons[provider.id] || "🤖"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{provider.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{provider.description}</p>
                  </div>
                  {selectedProvider === provider.id && (
                    <div className="w-5 h-5 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {currentProvider && currentProvider.available_models.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Modelo</label>
                <select
                  value={selectedModel || ""}
                  onChange={(e) => setSelectedModel(e.target.value || null)}
                  className="fryd-input"
                >
                  <option value="">Predeterminado</option>
                  {currentProvider.available_models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {currentProvider?.requires_api_key && (
              <div className="mb-4">
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  API Key
                  <span className="text-[10px] text-[var(--color-text-muted)] ml-1.5 font-normal">(se guarda localmente)</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentProvider?.has_system_key ? "Clave de la plataforma activa (opcional)" : "sk-... o tu clave de API"}
                  className="fryd-input"
                />
                {currentProvider?.has_system_key && (
                  <p className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Clave global de FRYD disponible. Puedes dejar este campo vacío.
                  </p>
                )}
              </div>
            )}

            <button onClick={handleTestConnection} className="btn-secondary w-full mb-3">
              Probar conexión
            </button>

            {connectionStatus && (
              <div className="text-xs p-2.5 rounded-lg mb-3 bg-[var(--color-surface-card)] border border-[var(--color-border-default)]">
                {connectionStatus}
              </div>
            )}

            <button
              onClick={async () => {
                setShowProviderModal(false);
                try {
                  await updateUserSettings({
                    ai_provider: selectedProvider,
                    ai_model: selectedModel,
                    ai_api_key: apiKey,
                  });
                } catch (err) {
                  console.error("Error saving AI settings to backend:", err);
                }
              }}
              className="btn-primary w-full"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* --- CREATIVE MODE DETAILS MODAL --- */}
      {showDetailModal && selectedNode && (() => {
        const catInfo = {
          diary: { icon: "📝", label: "Diario", color: "#8b5cf6", glowColor: "rgba(139, 92, 246, 0.28)", gradient: "from-violet-500/10 to-indigo-500/10", pillStyle: { bg: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.18)", text: "#a78bfa" } },
          habit: { icon: "⚡", label: "Hábito", color: "#14b8a6", glowColor: "rgba(20, 184, 166, 0.28)", gradient: "from-teal-500/10 to-cyan-500/10", pillStyle: { bg: "rgba(20, 184, 166, 0.08)", border: "rgba(20, 184, 166, 0.18)", text: "#5eead4" } },
          task: { icon: "✅", label: "Tarea", color: "#3b82f6", glowColor: "rgba(59, 130, 246, 0.28)", gradient: "from-blue-500/10 to-indigo-500/10", pillStyle: { bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.18)", text: "#60a5fa" } },
          concept: { icon: "🧠", label: "Concepto", color: "#6366f1", glowColor: "rgba(99, 102, 241, 0.30)", gradient: "from-indigo-500/10 to-blue-500/10", pillStyle: { bg: "rgba(99, 102, 241, 0.08)", border: "rgba(99, 102, 241, 0.18)", text: "#a5b4fc" } },
          project: { icon: "📁", label: "Proyecto", color: "#7c3aed", glowColor: "rgba(124, 58, 237, 0.28)", gradient: "from-violet-600/10 to-indigo-500/10", pillStyle: { bg: "rgba(124, 58, 237, 0.08)", border: "rgba(124, 58, 237, 0.18)", text: "#a78bfa" } },
          project_task: { icon: "📋", label: "Tarea Proj.", color: "#38bdf8", glowColor: "rgba(56, 189, 248, 0.25)", gradient: "from-sky-500/10 to-blue-500/10", pillStyle: { bg: "rgba(56, 189, 248, 0.08)", border: "rgba(56, 189, 248, 0.18)", text: "#7dd3fc" } },
        };

        const info = catInfo[selectedNode.type as keyof typeof catInfo] || catInfo.concept;

        // Parse diary title helper
        const match = selectedNode.label.match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);
        let parsedTitle = selectedNode.label;
        let parsedSubtitle = "";
        if (selectedNode.type === "diary" && match) {
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
            parsedTitle = rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : "Entrada de Diario";
            parsedSubtitle = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
          } catch {}
        } else if (selectedNode.type === "concept") {
          parsedTitle = selectedNode.label.replace("🧠 ", "");
        }

        // Get connected pills helper
        const connectedPills: { label: string; node: GraphNode; type: string }[] = [];
        filteredGraphData.links.forEach((l) => {
          const sId = typeof l.source === "string" ? l.source : (l.source as any).id;
          const tId = typeof l.target === "string" ? l.target : (l.target as any).id;

          if (sId === selectedNode.id) {
            const targetNode = filteredGraphData.nodes.find((n) => n.id === tId);
            if (targetNode) connectedPills.push({ label: targetNode.label, node: targetNode, type: l.type });
          } else if (tId === selectedNode.id) {
            const sourceNode = filteredGraphData.nodes.find((n) => n.id === sId);
            if (sourceNode) connectedPills.push({ label: sourceNode.label, node: sourceNode, type: l.type });
          }
        });

        // Filter duplicates
        const seen = new Set();
        const filteredPills = connectedPills.filter((item) => {
          const dup = seen.has(item.node.id);
          seen.add(item.node.id);
          return !dup;
        });

        return (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
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
                    {info.label}
                  </span>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="btn-ghost p-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Content */}
              <div className="space-y-5 text-left">
                <div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
                    {parsedTitle}
                  </h3>
                  {parsedSubtitle && (
                    <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-1">
                      {parsedSubtitle}
                    </p>
                  )}
                </div>

                {/* Metrics / Status Area */}
                {(selectedNode.type === "task" || selectedNode.type === "habit" || selectedNode.type === "project" || selectedNode.type === "project_task" || (selectedNode.type === "diary" && selectedNode.details?.energy_level !== undefined)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedNode.type === "task" && selectedNode.details && (
                      <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Estado:</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          selectedNode.details.status === "completed" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        }`}>
                          {selectedNode.details.status === "completed" ? "Completado" : "Pendiente"}
                        </span>
                      </div>
                    )}

                    {selectedNode.type === "project" && selectedNode.details && (
                      <>
                        <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Metodología:</span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {selectedNode.details.methodology.toUpperCase()}
                          </span>
                        </div>
                        <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Creado:</span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {selectedNode.details.created_at}
                          </span>
                        </div>
                      </>
                    )}

                    {selectedNode.type === "project_task" && selectedNode.details && (
                      <>
                        <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Columna:</span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {selectedNode.details.column_name}
                          </span>
                        </div>
                        <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Puntos de Historia:</span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            ⭐ {selectedNode.details.story_points}
                          </span>
                        </div>
                        <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between col-span-1 sm:col-span-2">
                          <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Recompensa:</span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            +{selectedNode.details.xp_reward} XP
                          </span>
                        </div>
                      </>
                    )}

                    {selectedNode.type === "habit" && selectedNode.details && (
                      <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Completado:</span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          🔥 {selectedNode.details.completions_count || 0} veces
                        </span>
                      </div>
                    )}

                    {selectedNode.type === "diary" && selectedNode.details?.energy_level !== undefined && (
                      <div className="bg-white/[0.01] border border-[var(--color-border-default)] p-3.5 rounded-xl flex items-center justify-between col-span-1 sm:col-span-2">
                        <span className="text-xs text-[var(--color-text-secondary)] font-semibold">Nivel de Energía:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <span 
                              key={level} 
                              className={`text-base transition-all duration-300 ${
                                level <= (selectedNode.details?.energy_level || 0) 
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
                {(selectedNode.details?.description || selectedNode.details?.content) && (
                  <div 
                    className="relative border-l-[3px] p-4 rounded-r-xl bg-white/[0.01] border-y border-r border-[var(--color-border-default)]" 
                    style={{ borderLeftColor: info.color }}
                  >
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line font-medium">
                      {selectedNode.details.description || selectedNode.details.content}
                    </p>
                  </div>
                )}

                {/* Connections List */}
                {filteredPills.length > 0 && (
                  <div className="pt-4 border-t border-[var(--color-border-default)]">
                    <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">
                      Conexiones Relacionadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {filteredPills.map((pill, i) => {
                        const targetInfo = catInfo[pill.node.type as keyof typeof catInfo] || catInfo.concept;
                        const style = targetInfo?.pillStyle || { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", text: "var(--color-text-secondary)" };
                        
                        return (
                          <span
                            key={i}
                            onClick={() => {
                              setSelectedNode(pill.node);
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
                <button onClick={() => setShowDetailModal(false)} className="btn-primary w-full">
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
