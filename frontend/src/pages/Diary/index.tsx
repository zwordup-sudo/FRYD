import { useEffect, useState } from "react";
import {
  getDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  extractTasksFromDiary,
} from "../../services/api";
import DiaryTaskExtractorModal from "../../components/DiaryTaskExtractorModal";

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

const moodConfig: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: "😊", label: "Feliz", color: "var(--color-accent-primary)" },
  sad: { emoji: "😢", label: "Triste", color: "var(--color-accent-info)" },
  annoyed: { emoji: "😤", label: "Molesto", color: "var(--color-accent-danger)" },
  excited: { emoji: "🤩", label: "Emocionado", color: "var(--color-accent-warning)" },
  neutral: { emoji: "😐", label: "Neutral", color: "var(--color-text-secondary)" },
  stressed: { emoji: "😰", label: "Estresado", color: "var(--color-accent-tertiary)" },
  calm: { emoji: "😌", label: "Calmado", color: "var(--color-accent-secondary)" },
};

const energyLabels = ["", "Muy baja", "Baja", "Normal", "Alta", "Muy alta"];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    mood: "neutral",
    energy_level: 3,
    tags: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [showExtractorModal, setShowExtractorModal] = useState(false);
  const [extractingId, setExtractingId] = useState<number | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const fetchEntries = async () => {
    try {
      const data = await getDiaryEntries();
      setEntries(data);
    } catch {
      setErrorMessage("Error al cargar entradas");
    }
  };

  const resetForm = () => {
    setForm({ title: "", content: "", mood: "neutral", energy_level: 3, tags: "" });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
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
    setErrorMessage("");
    setSuccessMessage("");
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.title.trim() && !form.content.trim()) {
      setErrorMessage("La entrada debe tener al menos título o contenido.");
      return;
    }

    try {
      const entryContent = form.content.trim();
      const payload = {
        title: form.title.trim() || null,
        content: entryContent || null,
        mood: form.mood || "neutral",
        energy_level: Number(form.energy_level),
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter((t) => t.length > 0)
          : ["general"],
      };

      if (editingId) {
        await updateDiaryEntry(editingId, payload);
        setSuccessMessage("Entrada actualizada");
      } else {
        await createDiaryEntry(payload);
        setSuccessMessage("Entrada creada");
      }

      resetForm();
      setShowModal(false);
      fetchEntries();

      // Trigger AI task extraction on new entries with content
      if (!editingId && entryContent) {
        try {
          const prefs = JSON.parse(localStorage.getItem("fryd_assistant_prefs") || "{}");
          const activeProvider = prefs.provider;
          if (activeProvider) {
            const apiKey = prefs.apiKey || null;
            const model = prefs.model || null;
            
            const detected = await extractTasksFromDiary({
              content: entryContent,
              provider: activeProvider,
              model,
              api_key: apiKey,
            });

            if (detected && detected.length > 0) {
              setExtractedTasks(detected);
              setShowExtractorModal(true);
            }
          }
        } catch (err) {
          console.error("Error extracting tasks from entry:", err);
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
        setErrorMessage("Configura un proveedor de IA en la pestaña Asistente primero.");
        setExtractingId(null);
        return;
      }
      const apiKey = prefs.apiKey || null;
      const model = prefs.model || null;

      const detected = await extractTasksFromDiary({
        content,
        provider: activeProvider,
        model,
        api_key: apiKey,
      });

      if (detected && detected.length > 0) {
        setExtractedTasks(detected);
        setShowExtractorModal(true);
      } else {
        setSuccessMessage("La IA analizó el texto pero no detectó ninguna tarea.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Error al conectar con la IA. Asegúrate de tener una clave de API válida configurada.");
    } finally {
      setExtractingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar esta entrada?")) return;
    try {
      await deleteDiaryEntry(id);
      if (editingId === id) resetForm();
      setSuccessMessage("Entrada eliminada");
      setShowModal(false);
      fetchEntries();
    } catch {
      setErrorMessage("Error al eliminar");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mi Diario</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Registra tus pensamientos, emociones y energía diaria.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary self-start sm:self-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva entrada
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="alert alert-error mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
          {successMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-static text-center py-4">
          <p className="text-2xl font-bold text-[var(--color-accent-tertiary)]">{entries.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Entradas</p>
        </div>
        <div className="card-static text-center py-4">
          <p className="text-2xl">
            {entries.length > 0
              ? moodConfig[entries[0].mood || "neutral"]?.emoji || "😐"
              : "—"}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Último ánimo</p>
        </div>
        <div className="card-static text-center py-4">
          <p className="text-2xl font-bold text-[var(--color-accent-secondary)]">
            {entries.length > 0 ? entries[0].energy_level ?? "—" : "—"}
            <span className="text-sm text-[var(--color-text-muted)]">/5</span>
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Última energía</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        {entries.length > 1 && (
          <div className="absolute left-[19px] top-8 bottom-8 w-px bg-[var(--color-border-default)] hidden sm:block" />
        )}

        <div className="flex flex-col gap-6">
          {entries.map((entry, i) => {
            const mood = moodConfig[entry.mood || "neutral"] || moodConfig.neutral;
            const isExpanded = expandedId === entry.id;
            const energyPercent = ((entry.energy_level || 3) / 5) * 100;

            return (
              <div
                key={entry.id}
                className="animate-slide-in-up flex gap-4"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Timeline dot */}
                <div className="hidden sm:flex flex-col items-center flex-shrink-0 pt-5">
                  <div
                    className="w-[10px] h-[10px] rounded-full ring-2 ring-[var(--color-surface-base)] z-10"
                    style={{ background: mood.color }}
                  />
                </div>

                {/* Card */}
                <div className="flex-1 card-static group">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    {/* Mood emoji */}
                    <span className="text-2xl flex-shrink-0" title={mood.label}>
                      {mood.emoji}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                            {entry.title || "Sin título"}
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="badge badge-purple text-[10px]" style={{ color: mood.color, background: `${mood.color}20` }}>
                            {mood.label}
                          </span>
                        </div>
                      </div>

                      {/* Content preview / full */}
                      {entry.content && (
                        <div className="mt-2">
                          <p className={`text-sm text-[var(--color-text-secondary)] ${!isExpanded ? "line-clamp-2" : ""}`}>
                            {entry.content}
                          </p>
                          {entry.content.length > 150 && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="text-xs text-[var(--color-accent-primary)] hover:underline mt-1"
                            >
                              {isExpanded ? "Ver menos" : "Ver más"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Energy bar */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-[var(--color-text-muted)]">Energía</span>
                        <div className="flex-1 max-w-[120px] h-1.5 bg-[var(--color-surface-input)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${energyPercent}%`,
                              background: energyPercent >= 80 ? "var(--color-accent-primary)" : energyPercent >= 40 ? "var(--color-accent-warning)" : "var(--color-accent-danger)",
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                          {energyLabels[entry.energy_level || 3]}
                        </span>
                      </div>

                      {/* Tags */}
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {entry.tags.map((tag, idx) => (
                            <span key={idx} className="badge badge-gray text-[10px] py-0.5">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-3 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {entry.content && (
                          <button
                            onClick={() => handleExtractTasks(entry.content || "", entry.id)}
                            className="btn-secondary text-xs py-1 px-2 flex items-center gap-1 cursor-pointer"
                            disabled={extractingId === entry.id}
                          >
                            <span className="text-emerald-400">✨</span>
                            {extractingId === entry.id ? "Analizando..." : "Sugerir Tareas"}
                          </button>
                        )}
                        <button onClick={() => openEdit(entry)} className="btn-ghost text-xs py-1 px-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="btn-danger text-xs py-1 px-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {entries.length === 0 && (
            <div className="empty-state py-16">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
                <path d="M7 8h10M7 12h7M7 16h4" />
              </svg>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
                No hay entradas aún
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Registra tu primer día en el diario
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content card-static" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {editingId ? "Editar entrada" : "Nueva entrada"}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-ghost p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Título</label>
                <input
                  name="title"
                  placeholder="¿Cómo fue tu día?"
                  value={form.title}
                  onChange={handleChange}
                  className="fryd-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Contenido</label>
                <textarea
                  name="content"
                  placeholder="Escribe tus pensamientos, reflexiones o ideas..."
                  value={form.content}
                  onChange={handleChange}
                  className="fryd-input min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mood selector */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Estado de ánimo</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(moodConfig).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, mood: key })}
                        className={`
                          flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs
                          transition-all duration-200 border
                          ${
                            form.mood === key
                              ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary-glow)] text-[var(--color-text-primary)] scale-105"
                              : "border-[var(--color-border-default)] bg-[var(--color-surface-input)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-accent)]"
                          }
                        `}
                      >
                        <span>{config.emoji}</span>
                        <span className="text-[10px] font-medium">{config.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy level */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
                    Energía: <span className="text-[var(--color-accent-primary)]">{energyLabels[form.energy_level]}</span>
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setForm({ ...form, energy_level: level })}
                        className={`
                          flex-1 py-2 rounded-lg text-xs font-semibold
                          transition-all duration-200 border
                          ${
                            form.energy_level >= level
                              ? "border-transparent text-[var(--color-text-inverse)]"
                              : "border-[var(--color-border-default)] bg-[var(--color-surface-input)] text-[var(--color-text-muted)]"
                          }
                        `}
                        style={form.energy_level >= level ? {
                          background: level <= 2 ? "var(--color-accent-danger)" : level <= 3 ? "var(--color-accent-warning)" : "var(--color-accent-primary)",
                          opacity: 0.6 + (level / 5) * 0.4,
                        } : undefined}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Etiquetas</label>
                <input
                  name="tags"
                  placeholder="reflexión, salud, ideas (separadas por coma)"
                  value={form.tags}
                  onChange={handleChange}
                  className="fryd-input"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={handleSubmit} className="btn-primary flex-1">
                  {editingId ? "Actualizar" : "Crear entrada"}
                </button>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Task Extractor Modal */}
      {showExtractorModal && (
        <DiaryTaskExtractorModal
          tasks={extractedTasks}
          onClose={() => {
            setShowExtractorModal(false);
            setExtractedTasks([]);
          }}
          onSuccess={(msg) => setSuccessMessage(msg)}
          onError={(msg) => setErrorMessage(msg)}
        />
      )}
    </div>
  );
}