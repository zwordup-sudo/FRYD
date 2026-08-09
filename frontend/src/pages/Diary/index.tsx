import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  extractTasksFromDiary,
} from "../../services/api";
import DiaryTaskExtractorModal from "../../components/DiaryTaskExtractorModal";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import StatTile from "../../components/ui/StatTile";

type DiaryEntry = {
  id: number;
  title?: string;
  content?: string;
  mood?: string;
  energy_level?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
};

type DiaryForm = {
  title: string;
  content: string;
  mood: string;
  energy_level: number;
  tags: string;
};

type MoodConfig = {
  emoji: string;
  label: string;
  color: string;
  soft: string;
};

const moodConfig: Record<string, MoodConfig> = {
  happy: { emoji: "😊", label: "Feliz", color: "#34d399", soft: "rgba(52, 211, 153, 0.12)" },
  sad: { emoji: "😢", label: "Triste", color: "#38bdf8", soft: "rgba(56, 189, 248, 0.12)" },
  annoyed: { emoji: "😤", label: "Molesto", color: "#f87171", soft: "rgba(248, 113, 113, 0.12)" },
  excited: { emoji: "🤩", label: "Emocionado", color: "#fbbf24", soft: "rgba(251, 191, 36, 0.12)" },
  neutral: { emoji: "😐", label: "Neutral", color: "#94a3b8", soft: "rgba(148, 163, 184, 0.10)" },
  stressed: { emoji: "😰", label: "Estresado", color: "#a78bfa", soft: "rgba(167, 139, 250, 0.12)" },
  calm: { emoji: "😌", label: "Calmado", color: "#14b8a6", soft: "rgba(20, 184, 166, 0.12)" },
};

const energyLabels = ["", "Muy baja", "Baja", "Normal", "Alta", "Muy alta"];
const emptyForm: DiaryForm = {
  title: "",
  content: "",
  mood: "neutral",
  energy_level: 3,
  tags: "",
};

const formatEntryDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const formatEntryTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatShortDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });

const isWithinLastDays = (dateStr: string, days: number) => {
  const date = new Date(dateStr);
  const limit = new Date();
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() - (days - 1));
  return date >= limit;
};

const isCurrentMonth = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);

const SparkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3-1.1 3.1a4 4 0 0 1-2.5 2.5L5.3 9.7l3.1 1.1a4 4 0 0 1 2.5 2.5L12 16.4l1.1-3.1a4 4 0 0 1 2.5-2.5l3.1-1.1-3.1-1.1a4 4 0 0 1-2.5-2.5L12 3Z" />
    <path d="m18 15-.55 1.55a2 2 0 0 1-1.25 1.25l-1.55.55 1.55.55a2 2 0 0 1 1.25 1.25L18 21.7l.55-1.55a2 2 0 0 1 1.25-1.25l1.55-.55-1.55-.55a2 2 0 0 1-1.25-1.25L18 15Z" />
  </svg>
);

const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" />
  </svg>
);

export default function DiaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState<DiaryForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [showExtractorModal, setShowExtractorModal] = useState(false);
  const [extractingId, setExtractingId] = useState<number | null>(null);

  const fetchEntries = async () => {
    try {
      const data = await getDiaryEntries();
      setEntries(data);
    } catch {
      setErrorMessage("Error al cargar entradas");
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  useEffect(() => {
    const routeState = location.state as { openCreate?: boolean } | null;
    if (routeState?.openCreate) {
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (openMenuId === null) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenuId]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesMood = moodFilter === "all" || (entry.mood || "neutral") === moodFilter;
      if (!matchesMood) return false;
      if (!normalizedQuery) return true;
      const searchable = [
        entry.title || "",
        entry.content || "",
        ...(entry.tags || []),
        moodConfig[entry.mood || "neutral"]?.label || "",
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [entries, moodFilter, query]);

  const recentEntries = useMemo(() => entries.filter((entry) => isWithinLastDays(entry.created_at, 7)), [entries]);
  const monthEntries = useMemo(() => entries.filter((entry) => isCurrentMonth(entry.created_at)), [entries]);
  const latestEntry = entries[0] || null;

  const averageEnergy = useMemo(() => {
    const values = recentEntries
      .map((entry) => Number(entry.energy_level || 0))
      .filter((value) => value > 0);
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [recentEntries]);

  const dominantMood = useMemo(() => {
    if (!recentEntries.length) return null;
    const counts = recentEntries.reduce<Record<string, number>>((acc, entry) => {
      const mood = entry.mood || "neutral";
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});
    const key = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return key ? moodConfig[key] || moodConfig.neutral : null;
  }, [recentEntries]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setErrorMessage("");
    setShowModal(true);
  };

  const openEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setForm({
      title: entry.title || "",
      content: entry.content || "",
      mood: entry.mood || "neutral",
      energy_level: entry.energy_level || 3,
      tags: entry.tags ? entry.tags.join(", ") : "",
    });
    setOpenMenuId(null);
    setErrorMessage("");
    setShowModal(true);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.title.trim() && !form.content.trim()) {
      setErrorMessage("La entrada debe tener al menos título o contenido.");
      return;
    }

    try {
      const wasEditing = editingId !== null;
      const entryContent = form.content.trim();
      const payload = {
        title: form.title.trim() || null,
        content: entryContent || null,
        mood: form.mood || "neutral",
        energy_level: Number(form.energy_level),
        tags: form.tags
          ? form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : ["general"],
      };

      if (editingId) {
        await updateDiaryEntry(editingId, payload);
        setSuccessMessage("Entrada actualizada");
      } else {
        await createDiaryEntry(payload);
        setSuccessMessage("Entrada guardada");
      }

      closeModal();
      fetchEntries();

      if (!wasEditing && entryContent) {
        try {
          const prefs = JSON.parse(localStorage.getItem("fryd_assistant_prefs") || "{}");
          const activeProvider = prefs.provider;
          if (activeProvider) {
            const detected = await extractTasksFromDiary({
              content: entryContent,
              provider: activeProvider,
              model: prefs.model || null,
              api_key: prefs.apiKey || null,
            });
            if (detected && detected.length > 0) {
              setExtractedTasks(detected);
              setShowExtractorModal(true);
            }
          }
        } catch (error) {
          console.error("Error extracting tasks from entry:", error);
        }
      }
    } catch {
      setErrorMessage("Error al guardar la entrada");
    }
  };

  const handleExtractTasks = async (content: string, entryId: number) => {
    setErrorMessage("");
    setSuccessMessage("");
    setExtractingId(entryId);
    try {
      const prefs = JSON.parse(localStorage.getItem("fryd_assistant_prefs") || "{}");
      const activeProvider = prefs.provider;
      if (!activeProvider) {
        setErrorMessage("Configura un proveedor de IA en Cerebro Digital para analizar esta entrada.");
        return;
      }

      const detected = await extractTasksFromDiary({
        content,
        provider: activeProvider,
        model: prefs.model || null,
        api_key: prefs.apiKey || null,
      });

      if (detected && detected.length > 0) {
        setExtractedTasks(detected);
        setShowExtractorModal(true);
      } else {
        setSuccessMessage("FRYD analizó la entrada y no detectó tareas pendientes.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo conectar con la IA. Revisa la configuración de tu proveedor.");
    } finally {
      setExtractingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar esta entrada?")) return;
    try {
      await deleteDiaryEntry(id);
      setOpenMenuId(null);
      if (editingId === id) resetForm();
      setSuccessMessage("Entrada eliminada");
      setShowModal(false);
      fetchEntries();
    } catch {
      setErrorMessage("Error al eliminar la entrada");
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="TU ESPACIO"
        title="Mi diario"
        description="Un lugar tranquilo para registrar lo que piensas, cómo te sientes y la energía con la que atraviesas cada día."
        action={(
          <button type="button" onClick={openCreate} className="btn-primary">
            <PlusIcon /> Nueva entrada
          </button>
        )}
      />

      {errorMessage && (
        <div className="alert alert-error mb-4" role="alert">
          <span>!</span>{errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success mb-4" role="status">
          <span>✓</span>{successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-6 mb-9">
        <StatTile
          label="Este mes"
          value={monthEntries.length}
          detail={monthEntries.length === 1 ? "entrada guardada" : "entradas guardadas"}
          icon={<BookIcon />}
          tone="brand"
        />
        <StatTile
          label="Ánimo reciente"
          value={dominantMood ? `${dominantMood.emoji} ${dominantMood.label}` : "—"}
          detail="Tendencia de los últimos 7 días"
          icon={<span className="text-base">♡</span>}
          tone="muted"
        />
        <StatTile
          label="Energía media"
          value={averageEnergy ? `${averageEnergy.toFixed(1)}/5` : "—"}
          detail="Promedio de los últimos 7 días"
          icon={<span className="text-base">⚡</span>}
          tone={averageEnergy >= 4 ? "success" : averageEnergy > 0 && averageEnergy <= 2 ? "warning" : "brand"}
        />
      </div>

      <section className="fryd-diary-reflection mb-6">
        <div className="fryd-diary-reflection-icon"><SparkIcon /></div>
        <div className="min-w-0 flex-1">
          <p className="fryd-section-label mb-1">MOMENTO DE REFLEXIÓN</p>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">¿Qué merece quedar escrito hoy?</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
            No necesitas escribir mucho. Una idea, una emoción o una pequeña victoria también cuentan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate("/assistant")} className="btn-secondary">
            <SparkIcon /> Reflexionar con FRYD
          </button>
          <button type="button" onClick={openCreate} className="btn-brand-soft">
            Escribir ahora
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.8fr)_minmax(17rem,.72fr)] gap-x-5 gap-y-9 items-start">
        <main className="min-w-0">
          <div className="fryd-diary-toolbar mb-4">
            <label className="fryd-search-field flex-1 min-w-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar en tus entradas..."
                aria-label="Buscar en el diario"
              />
            </label>
            <select
              value={moodFilter}
              onChange={(event) => setMoodFilter(event.target.value)}
              className="fryd-select fryd-diary-mood-filter"
              aria-label="Filtrar por estado de ánimo"
            >
              <option value="all">Todos los ánimos</option>
              {Object.entries(moodConfig).map(([key, mood]) => (
                <option key={key} value={key}>{mood.emoji} {mood.label}</option>
              ))}
            </select>
          </div>

          {filteredEntries.length > 0 ? (
            <div className="fryd-diary-timeline">
              {filteredEntries.map((entry, index) => {
                const mood = moodConfig[entry.mood || "neutral"] || moodConfig.neutral;
                const isExpanded = expandedId === entry.id;
                const energy = Math.max(1, Math.min(5, Number(entry.energy_level || 3)));

                return (
                  <article
                    key={entry.id}
                    className="fryd-diary-entry animate-slide-in-up"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <div className="fryd-diary-date-rail" aria-hidden="true">
                      <span>{new Date(entry.created_at).toLocaleDateString("es-MX", { day: "2-digit" })}</span>
                      <small>{new Date(entry.created_at).toLocaleDateString("es-MX", { month: "short" }).replace(".", "")}</small>
                    </div>

                    <div className="fryd-diary-entry-card">
                      <header className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="fryd-diary-mood-orb" style={{ color: mood.color, background: mood.soft }} title={mood.label}>
                            {mood.emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-[var(--color-text-muted)] capitalize">
                              {formatEntryDate(entry.created_at)} · {formatEntryTime(entry.created_at)}
                            </p>
                            <h3 className="mt-1 text-base sm:text-lg font-semibold tracking-[-0.015em] text-[var(--color-text-primary)]">
                              {entry.title || "Un momento del día"}
                            </h3>
                          </div>
                        </div>

                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            className="btn-ghost p-2"
                            aria-label="Más opciones"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMenuId(openMenuId === entry.id ? null : entry.id);
                            }}
                          >
                            <MoreIcon />
                          </button>
                          {openMenuId === entry.id && (
                            <div className="fryd-context-menu right-0 top-10" onClick={(event) => event.stopPropagation()}>
                              <button type="button" onClick={() => openEdit(entry)}>Editar entrada</button>
                              <button type="button" className="is-danger" onClick={() => handleDelete(entry.id)}>Eliminar</button>
                            </div>
                          )}
                        </div>
                      </header>

                      {entry.content && (
                        <div className="mt-4">
                          <p className={`fryd-diary-copy ${!isExpanded ? "line-clamp-4" : ""}`}>{entry.content}</p>
                          {entry.content.length > 260 && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="mt-2 text-xs font-medium text-[var(--color-accent-secondary)] hover:text-[var(--color-accent-tertiary)] transition-colors"
                            >
                              {isExpanded ? "Mostrar menos" : "Seguir leyendo"}
                            </button>
                          )}
                        </div>
                      )}

                      <div className="fryd-diary-entry-footer">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="fryd-diary-mood-chip" style={{ color: mood.color, background: mood.soft }}>
                            {mood.emoji} {mood.label}
                          </span>
                          <span className="fryd-diary-energy-chip" title={`Energía: ${energyLabels[energy]}`}>
                            <span>⚡</span>
                            <span className="fryd-diary-energy-dots">
                              {[1, 2, 3, 4, 5].map((level) => <i key={level} className={level <= energy ? "is-filled" : ""} />)}
                            </span>
                            <small>{energy}/5</small>
                          </span>
                          {(entry.tags || []).map((tag) => (
                            <span key={tag} className="badge badge-gray text-[10px]">#{tag}</span>
                          ))}
                        </div>

                        {entry.content && (
                          <button
                            type="button"
                            onClick={() => handleExtractTasks(entry.content || "", entry.id)}
                            disabled={extractingId === entry.id}
                            className="fryd-diary-ai-action"
                          >
                            <SparkIcon />
                            {extractingId === entry.id ? "Analizando..." : "Convertir ideas en tareas"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state fryd-diary-empty">
              <div className="fryd-empty-brand-icon"><BookIcon /></div>
              <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
                {entries.length === 0 ? "Tu diario empieza aquí" : "No encontramos entradas"}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)] max-w-md">
                {entries.length === 0
                  ? "Guarda una idea, una emoción o simplemente cómo estuvo tu día. No hace falta escribir mucho."
                  : "Prueba con otra búsqueda o cambia el filtro de ánimo."}
              </p>
              {entries.length === 0 && (
                <button type="button" onClick={openCreate} className="btn-primary mt-5"><PlusIcon /> Primera entrada</button>
              )}
            </div>
          )}
        </main>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-5">
          <section className="fryd-side-card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="fryd-section-label mb-1">ÚLTIMOS 7 DÍAS</p>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Tu pulso reciente</h2>
              </div>
              <span className="fryd-diary-week-count">{recentEntries.length}</span>
            </div>

            <div className="fryd-diary-week-grid">
              <div>
                <strong>{recentEntries.length}</strong>
                <small>entradas</small>
              </div>
              <div>
                <strong>{averageEnergy ? averageEnergy.toFixed(1) : "—"}</strong>
                <small>energía</small>
              </div>
              <div>
                <strong>{dominantMood?.emoji || "—"}</strong>
                <small>{dominantMood?.label || "sin datos"}</small>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-[var(--color-text-secondary)]">Energía registrada</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">más reciente →</span>
              </div>
              <div className="fryd-diary-energy-history">
                {[...recentEntries].reverse().slice(-7).map((entry) => {
                  const value = Math.max(1, Math.min(5, Number(entry.energy_level || 3)));
                  return (
                    <div key={entry.id} title={`${formatShortDate(entry.created_at)} · ${value}/5`}>
                      <span style={{ height: `${Math.max(22, value * 18)}%` }} />
                    </div>
                  );
                })}
                {recentEntries.length === 0 && [1, 2, 3, 4, 5, 6, 7].map((item) => <div key={item}><span className="is-empty" style={{ height: "14%" }} /></div>)}
              </div>
            </div>
          </section>

          <section className="fryd-side-card">
            <p className="fryd-section-label mb-3">ÚLTIMO REGISTRO</p>
            {latestEntry ? (
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{(moodConfig[latestEntry.mood || "neutral"] || moodConfig.neutral).emoji}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{latestEntry.title || "Un momento del día"}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{formatShortDate(latestEntry.created_at)} · Energía {latestEntry.energy_level || 3}/5</p>
                  </div>
                </div>
                {latestEntry.content && <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-3 line-clamp-3">{latestEntry.content}</p>}
                <button type="button" onClick={() => openEdit(latestEntry)} className="btn-ghost text-xs mt-3 px-0">Continuar escribiendo →</button>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">Cuando escribas tu primera entrada, aparecerá aquí.</p>
            )}
          </section>

          <section className="fryd-diary-insight">
            <div className="fryd-diary-insight-icon"><SparkIcon /></div>
            <div>
              <p className="fryd-section-label mb-1">FRYD REFLEXIÓN</p>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                {recentEntries.length >= 3 ? "Ya tienes suficiente contexto para observar patrones." : "La constancia revela patrones que un solo día no muestra."}
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mt-2">
                {recentEntries.length >= 3
                  ? `Tu energía media reciente es ${averageEnergy.toFixed(1)}/5. Usa Cerebro Digital para conectar tu diario con tareas y hábitos.`
                  : "Escribe algunas veces durante la semana y FRYD podrá ayudarte a relacionar ánimo, energía, tareas y hábitos."}
              </p>
              <button type="button" onClick={() => navigate("/assistant")} className="mt-4 text-xs font-semibold text-[var(--color-accent-secondary)] hover:text-[var(--color-accent-tertiary)] transition-colors">
                Abrir Cerebro Digital →
              </button>
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={showModal}
        title={editingId ? "Editar reflexión" : "Nueva entrada"}
        description={editingId ? "Actualiza lo que quieras conservar de este momento." : "Escribe con libertad. FRYD guardará el contexto para ayudarte a encontrar patrones después."}
        icon={<BookIcon />}
        onClose={closeModal}
        footer={(
          <>
            <button type="button" onClick={closeModal} className="btn-secondary sm:min-w-28">Cancelar</button>
            <button type="button" onClick={handleSubmit} className="btn-primary sm:min-w-36">
              {editingId ? "Guardar cambios" : "Guardar entrada"}
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div className="fryd-diary-writing-prompt">
            <SparkIcon />
            <span>Idea para empezar: ¿qué pasó hoy que no quieres olvidar?</span>
          </div>

          <label className="block">
            <span className="fryd-field-label">Título <span>opcional</span></span>
            <input
              name="title"
              placeholder="Ponle un nombre a este momento"
              value={form.title}
              onChange={handleChange}
              className="fryd-input mt-1.5"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="fryd-field-label">Lo que quieres recordar <span>escribe todo lo que necesites</span></span>
            <textarea
              name="content"
              placeholder="Pensamientos, ideas, emociones, decisiones, pequeñas victorias..."
              value={form.content}
              onChange={handleChange}
              className="fryd-input fryd-diary-editor mt-1.5"
              rows={7}
            />
          </label>

          <div>
            <span className="fryd-field-label">¿Cómo te sientes?</span>
            <div className="fryd-diary-mood-picker mt-2">
              {Object.entries(moodConfig).map(([key, mood]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, mood: key })}
                  className={form.mood === key ? "is-selected" : ""}
                  style={form.mood === key ? { borderColor: mood.color, background: mood.soft } : undefined}
                >
                  <span>{mood.emoji}</span>
                  <small>{mood.label}</small>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="fryd-field-label">Nivel de energía <span>{energyLabels[form.energy_level]}</span></span>
            <div className="fryd-diary-energy-picker mt-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm({ ...form, energy_level: level })}
                  className={form.energy_level === level ? "is-selected" : ""}
                >
                  <span>{level}</span>
                  <small>{energyLabels[level]}</small>
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="fryd-field-label">Etiquetas <span>separadas por coma</span></span>
            <input
              name="tags"
              placeholder="personal, trabajo, gratitud, idea"
              value={form.tags}
              onChange={handleChange}
              className="fryd-input mt-1.5"
            />
          </label>
        </div>
      </Modal>

      {showExtractorModal && (
        <DiaryTaskExtractorModal
          tasks={extractedTasks}
          onClose={() => {
            setShowExtractorModal(false);
            setExtractedTasks([]);
          }}
          onSuccess={(message) => setSuccessMessage(message)}
          onError={(message) => setErrorMessage(message)}
        />
      )}
    </div>
  );
}
