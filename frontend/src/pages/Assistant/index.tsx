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
    text: "var(--color-accent-primary)",
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
        { id: "ollama", name: "Ollama (Local)", description: "Modelo local con Ollama", requires_api_key: false, available_models: ["llama3", "mistral"], is_local: true },
        { id: "openai", name: "OpenAI", description: "GPT-4, GPT-3.5", requires_api_key: true, available_models: ["gpt-4o-mini", "gpt-4o"], is_local: false },
        { id: "anthropic", name: "Anthropic", description: "Claude", requires_api_key: true, available_models: ["claude-sonnet-4-20250514"], is_local: false },
        { id: "gemini", name: "Google Gemini", description: "Gemini Pro", requires_api_key: true, available_models: ["gemini-2.0-flash"], is_local: false },
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
    <div className="animate-fade-in h-full flex flex-col -m-4 sm:-m-6 lg:-m-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M12 2a7 7 0 017 7v1a7 7 0 01-14 0V9a7 7 0 017-7z" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--color-text-primary)]">Cerebro Digital</h1>
            <div className="flex items-center gap-1.5">
              <div className="status-dot status-dot-active" />
              <span className="text-xs text-[var(--color-text-muted)]">
                {icon} {currentProvider?.name || selectedProvider}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle de Modo de Vista */}
          {!isLoadingGraph && graphData.nodes.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-0.5 rounded-lg flex gap-0.5">
                <button
                  onClick={() => setViewMode("creative")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === "creative"
                      ? "bg-[var(--color-accent-primary)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--color-text-primary)]"
                  }`}
                  title="Exploración Creativa / Divergente"
                >
                  <span>🎨</span>
                  <span className="hidden md:inline">Divergente</span>
                </button>
                <button
                  onClick={() => setViewMode("zen")}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === "zen"
                      ? "bg-[var(--color-accent-primary)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--color-text-primary)]"
                  }`}
                  title="Vista Ordenada / Zen"
                >
                  <span>🧘</span>
                  <span className="hidden md:inline">Zen</span>
                </button>
              </div>

              {/* Filtro de Categorías */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 cursor-pointer ${
                    Object.values(visibleTypes).includes(false)
                      ? "border-[var(--color-accent-primary)] text-[var(--color-accent-primary)] bg-[var(--color-accent-primary-glow)]"
                      : ""
                  }`}
                  title="Filtrar tipos de nodo"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span>Filtrar</span>
                </button>

                {showFilterDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-48 card-static z-30 shadow-xl border border-[var(--color-border-default)] p-3 space-y-2.5"
                    style={{ background: "var(--color-surface-elevated)" }}
                  >
                    <h4 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Mostrar en Cerebro</h4>
                    <div className="space-y-2">
                      {[
                        { type: "diary", label: "📝 Diarios" },
                        { type: "habit", label: "⚡ Hábitos" },
                        { type: "task", label: "✅ Tareas" },
                        { type: "concept", label: "🧠 Conceptos" },
                        { type: "project", label: "📁 Proyectos" },
                        { type: "project_task", label: "📋 Tareas Proj." },
                      ].map((item) => (
                        <label key={item.type} className="flex items-center gap-2.5 text-xs text-[var(--color-text-secondary)] hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={visibleTypes[item.type]}
                            onChange={() => setVisibleTypes({
                              ...visibleTypes,
                              [item.type]: !visibleTypes[item.type],
                            })}
                            className="rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary-glow)]"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <button onClick={loadGraph} className="btn-secondary p-2 text-xs" title="Actualizar cerebro">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67"/></svg>
          </button>
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className={`btn-ghost text-xs ${showHistoryPanel ? "bg-white/[0.08]" : ""}`}
            title="Historial de Chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </button>
          <button onClick={startNewConversation} className="btn-ghost text-xs" title="Nuevo Chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button
            onClick={() => setShowChatPanel(!showChatPanel)}
            className={`btn-secondary text-xs flex items-center gap-1.5 ${showChatPanel ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary-glow)] text-[var(--color-accent-primary)]" : ""}`}
            title="Mostrar/Ocultar Chat"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span>Chat</span>
          </button>
          <button
            onClick={() => setShowProviderModal(true)}
            className="btn-secondary text-xs"
          >
            <span>{icon}</span>
            <span className="hidden sm:inline ml-1">{currentProvider?.name || selectedProvider}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* History panel with search */}
        {showHistoryPanel && (
          <div className="w-64 border-r border-[var(--color-border-default)] bg-[var(--color-surface-elevated)] overflow-y-auto flex-shrink-0 animate-slide-in-left z-10 flex flex-col">
            <div className="p-3 flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Chats Anteriores</h3>
              {/* Search bar (Mejora 7) */}
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="fryd-input text-[10px] py-1.5 pl-7 pr-2"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                    conversationId === conv.id
                      ? "bg-[var(--color-accent-primary-glow)] text-[var(--color-accent-primary)] font-medium"
                      : "text-[var(--color-text-secondary)] hover:bg-white/[0.04]"
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <span className="flex-1 truncate text-xs">{conv.title || "Sin título"}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 btn-danger p-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
              {filteredConversations.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)] p-2">
                  {searchQuery ? "Sin resultados" : "Sin chats guardados"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main Content Split: Graph and Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

          {/* Left panel: The Knowledge Graph */}
          <div className="flex-1 h-2/3 md:h-full border-b md:border-b-0 md:border-r border-[var(--color-border-default)] bg-[var(--color-bg-primary)] relative">

            {isLoadingGraph ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-[var(--color-accent-primary-glow)] border-t-[var(--color-accent-primary)] animate-spin" />
                <p className="text-xs text-[var(--color-text-muted)]">Cargando tu Cerebro Digital...</p>
              </div>
            ) : graphData.nodes.length === 0 ? (
              /* Empty state premium (Mejora 8) */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] opacity-10 blur-2xl absolute inset-0 m-auto" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent-primary-glow)] to-[var(--color-accent-secondary)]/10 border border-[var(--color-border-default)] flex items-center justify-center mx-auto">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a7 7 0 017 7v1a7 7 0 01-14 0V9a7 7 0 017-7z" />
                      <circle cx="9" cy="9" r="1" fill="currentColor" />
                      <circle cx="15" cy="9" r="1" fill="currentColor" />
                      <path d="M9 13c1.5 1.5 4.5 1.5 6 0" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Tu cerebro digital está naciendo
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] max-w-xs mb-5 leading-relaxed">
                  A medida que uses FRYD, aquí se visualizarán las conexiones entre tus tareas, hábitos y reflexiones.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  {[
                    { label: "📝 Escribe en tu diario", path: "/diary" },
                    { label: "⚡ Crea un hábito", path: "/habit" },
                    { label: "✅ Agrega una tarea", path: "/task" },
                  ].map((action) => (
                    <a
                      key={action.path}
                      href={action.path}
                      className="text-xs p-2.5 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)] text-[var(--color-text-secondary)] transition-all text-center hover:bg-[var(--color-accent-primary-glow)]"
                    >
                      {action.label}
                    </a>
                  ))}
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
              <ZenView
                data={filteredGraphData}
                onNodeSelect={(node) => setSelectedNode(node)}
                selectedNodeId={selectedNode?.id || null}
              />
            )}
          </div>

          {showChatPanel && (
            <div className="w-full md:w-96 h-1/3 md:h-full bg-[var(--color-surface-elevated)] flex flex-col flex-shrink-0 overflow-hidden">

              {/* Context details section */}
              <div className="p-4 border-b border-[var(--color-border-default)] bg-[var(--color-surface-card)] flex-shrink-0">
                {selectedNode ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Nodo Seleccionado
                      </span>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="text-xs text-[var(--color-accent-primary)] hover:underline flex items-center gap-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Volver al cerebro
                      </button>
                    </div>

                    <h3 className="font-semibold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                      {selectedNode.type === "diary" && "📝"}
                      {selectedNode.type === "habit" && "⚡"}
                      {selectedNode.type === "task" && "✅"}
                      {selectedNode.type === "concept" && "🧠"}
                      {selectedNode.type === "project" && "📁"}
                      {selectedNode.type === "project_task" && "📋"}
                      {selectedNode.label}
                    </h3>

                    <div className="mt-2 text-xs text-[var(--color-text-secondary)] max-h-28 overflow-y-auto pr-1">
                      {selectedNode.type === "diary" && selectedNode.details && (
                        <div className="flex flex-col gap-1.5">
                          {selectedNode.details.mood && <p><strong>Ánimo:</strong> {selectedNode.details.mood}</p>}
                          {selectedNode.details.energy_level !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <strong>Energía:</strong>
                              <div className="w-20 h-1.5 rounded-full bg-[var(--color-border-default)] overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${selectedNode.details.energy_level * 20}%` }} />
                              </div>
                            </div>
                          )}
                          {selectedNode.details.content && <p className="italic text-[var(--color-text-muted)] mt-1 whitespace-pre-wrap">"{selectedNode.details.content}"</p>}
                        </div>
                      )}
                      {selectedNode.type === "habit" && selectedNode.details && (
                        <div className="flex flex-col gap-1">
                          <p><strong>Frecuencia:</strong> {selectedNode.details.frequency}</p>
                          <p><strong>Estado:</strong> {selectedNode.details.status === "active" ? "Activo" : "Inactivo"}</p>
                          <p><strong>Completados:</strong> {selectedNode.details.completions_count} veces</p>
                          {selectedNode.details.description && <p className="italic mt-1">"{selectedNode.details.description}"</p>}
                        </div>
                      )}
                      {selectedNode.type === "task" && selectedNode.details && (
                        <div className="flex flex-col gap-1">
                          <p><strong>Estado:</strong> {selectedNode.details.status === "completed" ? "Completada" : "Pendiente"}</p>
                          {selectedNode.details.due_date && <p><strong>Fecha límite:</strong> {selectedNode.details.due_date}</p>}
                          {selectedNode.details.description && <p className="italic mt-1">"{selectedNode.details.description}"</p>}
                        </div>
                      )}
                      {selectedNode.type === "project" && selectedNode.details && (
                        <div className="flex flex-col gap-1">
                          <p><strong>Metodología:</strong> {selectedNode.details.methodology.toUpperCase()}</p>
                          <p><strong>Creado el:</strong> {selectedNode.details.created_at}</p>
                          {selectedNode.details.description && <p className="italic mt-1">"{selectedNode.details.description}"</p>}
                        </div>
                      )}
                      {selectedNode.type === "project_task" && selectedNode.details && (
                        <div className="flex flex-col gap-1">
                          <p><strong>Columna:</strong> {selectedNode.details.column_name}</p>
                          <p><strong>Puntos de Historia:</strong> {selectedNode.details.story_points}</p>
                          <p><strong>Recompensa XP:</strong> {selectedNode.details.xp_reward} XP</p>
                          {selectedNode.details.due_date && <p><strong>Fecha límite:</strong> {selectedNode.details.due_date}</p>}
                          {selectedNode.details.description && <p className="italic mt-1">"{selectedNode.details.description}"</p>}
                        </div>
                      )}
                      {selectedNode.type === "concept" && (
                        <p className="italic text-[var(--color-text-muted)]">
                          Este concepto agrupa elementos que comparten este tema en común.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                      Cerebro Activo
                    </span>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Haz clic en un nodo para explorar sus detalles y preguntar a la IA.
                    </p>
                  </div>
                )}
              </div>

              {/* Chat Messages area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {errorMessage && (
                  <div className="alert alert-error mb-3 text-xs p-2 flex-shrink-0">
                    {errorMessage}
                  </div>
                )}

                {messages.length === 0 && (
                  <div className="my-auto flex flex-col gap-4">
                    {/* Insights cards (Mejora 5) */}
                    {!isLoadingInsights && insights.length > 0 && (
                      <div className="flex flex-col gap-2 mb-2">
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                          Insights del día
                        </span>
                        {insights.map((insight, i) => {
                          const style = insightStyles[insight.type] || insightStyles.info;
                          return (
                            <div
                              key={i}
                              className="p-3 rounded-xl border transition-all hover:scale-[1.01] cursor-default animate-slide-in-up"
                              style={{
                                background: style.bg,
                                borderColor: style.border,
                                animationDelay: `${i * 80}ms`,
                              }}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="text-lg flex-shrink-0">{insight.icon}</span>
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: style.text }}>
                                    {insight.title}
                                  </p>
                                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                                    {insight.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick suggestions */}
                    <div className="text-center">
                      <p className="text-xs text-[var(--color-text-muted)] px-4 mb-3">
                        {selectedNode
                          ? `Pregunta sobre "${selectedNode.label}"`
                          : "¿En qué te puedo ayudar?"}
                      </p>
                      <div className="flex flex-col gap-1.5 max-w-[280px] mx-auto">
                        {(selectedNode
                          ? [
                              "¿Qué consejos me das sobre esto?",
                              "¿Con qué otros elementos se relaciona?",
                              "Ayúdame a mejorar este aspect",
                            ]
                          : [
                              "¿Cómo mejorar mi constancia?",
                              "Analiza mi estado de ánimo reciente",
                              "¿Qué hábitos están conectados con mis tareas?",
                            ]
                        ).map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => handleQuickQuestion(suggestion)}
                            className="text-left text-xs p-2.5 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)] text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-accent-primary-glow)]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 mb-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs ${
                        msg.role === "user"
                          ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] rounded-br-none"
                          : "bg-[var(--color-surface-card)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-bl-none"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        /* Markdown rendering (Mejora 1) */
                        <div className="prose-fryd">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                      <span className="text-[9px] opacity-50 block text-right mt-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2.5 mb-3">
                    <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] rounded-xl rounded-bl-none px-3 py-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input area */}
              <div className="p-3 border-t border-[var(--color-border-default)] bg-[var(--color-surface-card)] flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedNode ? "Preguntar sobre este nodo..." : "Escribe un mensaje..."}
                    className="fryd-input pr-3 resize-none max-h-[80px] leading-relaxed text-xs py-2 min-h-[36px]"
                    rows={1}
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className={`
                      w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                      ${
                        input.trim() && !isTyping
                          ? "gradient-green text-[var(--color-text-inverse)] hover:scale-105"
                          : "bg-[var(--color-surface-card)] text-[var(--color-text-muted)] cursor-not-allowed border border-[var(--color-border-default)]"
                      }
                    `}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Provider Selector Modal */}
      {showProviderModal && (
        <div className="modal-overlay" onClick={() => setShowProviderModal(false)}>
          <div className="modal-content card-static max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Configurar Asistente</h2>
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
                  placeholder="sk-... o tu clave de API"
                  className="fryd-input"
                />
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
          diary: { icon: "📝", label: "Diario", color: "#a855f7", glowColor: "rgba(168, 85, 247, 0.35)", gradient: "from-purple-500/10 to-indigo-500/10", pillStyle: { bg: "rgba(168, 85, 247, 0.08)", border: "rgba(168, 85, 247, 0.2)", text: "#c084fc" } },
          habit: { icon: "⚡", label: "Hábito", color: "#10b981", glowColor: "rgba(16, 185, 129, 0.35)", gradient: "from-emerald-500/10 to-teal-500/10", pillStyle: { bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)", text: "#34d399" } },
          task: { icon: "✅", label: "Tarea", color: "#06b6d4", glowColor: "rgba(6, 182, 212, 0.35)", gradient: "from-cyan-500/10 to-blue-500/10", pillStyle: { bg: "rgba(6, 182, 212, 0.08)", border: "rgba(6, 182, 212, 0.2)", text: "#22d3ee" } },
          concept: { icon: "🧠", label: "Concepto", color: "#ec4899", glowColor: "rgba(236, 72, 153, 0.35)", gradient: "from-pink-500/10 to-rose-500/10", pillStyle: { bg: "rgba(236, 72, 153, 0.08)", border: "rgba(236, 72, 153, 0.2)", text: "#f472b6" } },
          project: { icon: "📁", label: "Proyecto", color: "#6366f1", glowColor: "rgba(99, 102, 241, 0.35)", gradient: "from-indigo-500/10 to-violet-500/10", pillStyle: { bg: "rgba(99, 102, 241, 0.08)", border: "rgba(99, 102, 241, 0.2)", text: "#818cf8" } },
          project_task: { icon: "📋", label: "Tarea Proj.", color: "#8b5cf6", glowColor: "rgba(139, 92, 246, 0.35)", gradient: "from-violet-500/10 to-purple-500/10", pillStyle: { bg: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.2)", text: "#a78bfa" } },
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
