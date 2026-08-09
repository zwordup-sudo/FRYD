import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createTask, deleteTask, getTasks, updateTask } from "../../services/api";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import SegmentedTabs from "../../components/ui/SegmentedTabs";
import StatTile from "../../components/ui/StatTile";

type TaskStatus = "pending" | "in_progress" | "completed";

type Task = {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

type FilterStatus = "all" | TaskStatus;

type TaskForm = {
  title: string;
  description: string;
  due_date: string;
  status: TaskStatus;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  due_date: "",
  status: "pending",
};

const statusConfig: Record<TaskStatus, { label: string; badge: string; tone: string }> = {
  pending: { label: "Pendiente", badge: "badge-gray", tone: "muted" },
  in_progress: { label: "En progreso", badge: "badge-yellow", tone: "warning" },
  completed: { label: "Completada", badge: "badge-green", tone: "success" },
};

const isValidDate = (dateString?: string) => {
  if (!dateString) return false;
  return !Number.isNaN(new Date(dateString).getTime());
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getUrgency = (task: Task) => {
  if (task.status === "completed" || !isValidDate(task.due_date)) return "normal";
  const due = new Date(task.due_date);
  const now = new Date();
  const hours = (due.getTime() - now.getTime()) / 3_600_000;
  if (hours < 0) return "overdue";
  if (isSameDay(due, now)) return "today";
  if (hours <= 72) return "soon";
  return "normal";
};

const urgencyConfig = {
  overdue: { label: "Vencida", className: "text-[var(--color-accent-danger)] bg-red-400/10 border-red-400/15" },
  today: { label: "Hoy", className: "text-amber-300 bg-amber-400/10 border-amber-400/15" },
  soon: { label: "Pronto", className: "text-sky-300 bg-sky-400/10 border-sky-400/15" },
  normal: { label: "", className: "" },
};

const formatTaskDate = (dateString: string) => {
  if (!isValidDate(dateString)) return "Sin fecha";
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const time = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  if (isSameDay(date, now)) return `Hoy · ${time}`;
  if (isSameDay(date, tomorrow)) return `Mañana · ${time}`;

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TaskIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="m8 12 2.5 2.5L16 9" />
  </svg>
);

export default function TaskPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch {
      setErrorMessage("Error al cargar tareas");
    }
  };

  useEffect(() => {
    loadTasks();
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

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      due_date: task.due_date ? task.due_date.slice(0, 16) : "",
      status: task.status || "pending",
    });
    setOpenMenuId(null);
    setErrorMessage("");
    setShowModal(true);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value } as TaskForm));
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.title.trim()) {
      setErrorMessage("La tarea debe tener un título.");
      return;
    }
    if (!form.due_date) {
      setErrorMessage("La tarea debe tener una fecha.");
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: `${form.due_date}:00`,
        status: form.status,
      };

      if (editingId) {
        await updateTask(editingId, payload);
        setSuccessMessage("Tarea actualizada");
      } else {
        await createTask(payload);
        setSuccessMessage("Tarea creada");
      }

      closeModal();
      loadTasks();
    } catch {
      setErrorMessage("Error al guardar la tarea");
    }
  };

  const handleDelete = async (id: number) => {
    setOpenMenuId(null);
    if (!confirm("¿Seguro que deseas eliminar esta tarea?")) return;
    try {
      await deleteTask(id);
      if (editingId === id) resetForm();
      setSuccessMessage("Tarea eliminada");
      setShowModal(false);
      loadTasks();
    } catch {
      setErrorMessage("Error al eliminar");
    }
  };

  const handleQuickStatus = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateTask(task.id, { status: newStatus });
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: newStatus } : item)));
    } catch {
      setErrorMessage("Error al actualizar estado");
    }
  };

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
  }), [tasks]);

  const completionRate = tasks.length ? Math.round((counts.completed / tasks.length) * 100) : 0;
  const overdueCount = useMemo(
    () => tasks.filter((task) => task.status !== "completed" && getUrgency(task) === "overdue").length,
    [tasks]
  );
  const todayCount = useMemo(
    () => tasks.filter((task) => task.status !== "completed" && isValidDate(task.due_date) && isSameDay(new Date(task.due_date), new Date())).length,
    [tasks]
  );

  const nextTask = useMemo(() => {
    const now = Date.now();
    return [...tasks]
      .filter((task) => task.status !== "completed" && isValidDate(task.due_date) && new Date(task.due_date).getTime() >= now)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    return tasks
      .filter((task) => filter === "all" || task.status === filter)
      .filter((task) => !query || `${task.title} ${task.description || ""}`.toLocaleLowerCase("es-MX").includes(query))
      .sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        const aTime = isValidDate(a.due_date) ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = isValidDate(b.due_date) ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
  }, [tasks, filter, search]);

  const filters: Array<{ key: FilterStatus; label: string; count?: number }> = [
    { key: "all" as const, label: "Todas", count: counts.all },
    { key: "pending" as const, label: "Pendientes", count: counts.pending },
    { key: "in_progress" as const, label: "En progreso", count: counts.in_progress },
    { key: "completed" as const, label: "Completadas", count: counts.completed },
  ];

  const nextStatus = (task: Task): TaskStatus => {
    if (task.status === "pending") return "in_progress";
    if (task.status === "in_progress") return "completed";
    return "pending";
  };

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader
        eyebrow="Productividad"
        title="Mis tareas"
        description="Organiza tus pendientes, prioriza lo importante y mantén claro qué sigue en tu día."
        action={(
          <button onClick={openCreate} className="btn-primary px-5 py-3">
            <PlusIcon />
            Nueva tarea
          </button>
        )}
      />

      {(errorMessage || successMessage) && (
        <div className={`alert ${errorMessage ? "alert-error" : "alert-success"} mb-5`} role="status">
          {errorMessage || successMessage}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-6 mb-9">
        <StatTile
          label="Pendientes"
          value={counts.pending}
          detail={todayCount ? `${todayCount} para hoy` : "Tu bandeja actual"}
          tone="muted"
          icon={<span className="w-2.5 h-2.5 rounded-full bg-slate-400" />}
        />
        <StatTile
          label="En progreso"
          value={counts.in_progress}
          detail="Trabajo en movimiento"
          tone="warning"
          icon={<span className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
        />
        <StatTile
          label="Completadas"
          value={counts.completed}
          detail={`${completionRate}% del total`}
          tone="success"
          icon={<span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />}
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_21rem] gap-x-6 gap-y-9 items-start">
        <section className="min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <SegmentedTabs<FilterStatus> tabs={filters} value={filter} onChange={setFilter} />

            <label className="fryd-search-field lg:w-64">
              <span className="text-[var(--color-text-muted)]"><SearchIcon /></span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar tareas..."
                aria-label="Buscar tareas"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Limpiar búsqueda">
                  ×
                </button>
              )}
            </label>
          </div>

          <div className="fryd-panel overflow-visible">
            <div className="px-5 sm:px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Lista de tareas</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {filteredTasks.length} {filteredTasks.length === 1 ? "resultado" : "resultados"}
                </p>
              </div>
              {overdueCount > 0 && <span className="badge badge-red">{overdueCount} vencida{overdueCount === 1 ? "" : "s"}</span>}
            </div>

            <div className="divide-y divide-[var(--color-border-subtle)]">
              {filteredTasks.map((task, index) => {
                const config = statusConfig[task.status];
                const urgency = getUrgency(task);
                const urgencyMeta = urgencyConfig[urgency];

                return (
                  <article
                    key={task.id}
                    className={`fryd-task-row animate-slide-in-up ${task.status === "completed" ? "is-completed" : ""}`}
                    style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => handleQuickStatus(task, nextStatus(task))}
                      className={`fryd-task-check is-${task.status}`}
                      aria-label={`Cambiar estado de ${task.title}`}
                      title={task.status === "completed" ? "Volver a pendiente" : task.status === "in_progress" ? "Marcar como completada" : "Marcar en progreso"}
                    >
                      {task.status === "completed" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 7" /></svg>
                      )}
                      {task.status === "in_progress" && <span />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="fryd-task-title">{task.title}</h3>
                        <span className={`badge ${config.badge}`}>{config.label}</span>
                        {urgencyMeta.label && <span className={`fryd-urgency-chip ${urgencyMeta.className}`}>{urgencyMeta.label}</span>}
                      </div>

                      {task.description && <p className="fryd-task-description">{task.description}</p>}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-text-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                          {formatTaskDate(task.due_date)}
                        </span>
                        <span className="hidden sm:inline text-[var(--color-border-accent)]">•</span>
                        <span className="capitalize">{config.label}</span>
                      </div>
                    </div>

                    <div className="relative flex-shrink-0" onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="fryd-icon-button"
                        aria-label={`Acciones para ${task.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((current) => current === task.id ? null : task.id);
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
                      </button>

                      {openMenuId === task.id && (
                        <div className="fryd-context-menu" onClick={(event) => event.stopPropagation()}>
                          <button type="button" onClick={() => openEdit(task)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" /></svg>
                            Editar tarea
                          </button>
                          <button type="button" className="is-danger" onClick={() => handleDelete(task.id)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="empty-state py-16 sm:py-20">
                  <div className="w-12 h-12 rounded-2xl brand-gradient-soft border border-[var(--color-border-accent)] flex items-center justify-center text-indigo-300 mb-3">
                    <TaskIcon />
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {search ? "No encontramos coincidencias" : filter === "all" ? "Todavía no hay tareas" : `No hay tareas ${filters.find((item) => item.key === filter)?.label.toLowerCase()}`}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">
                    {search ? "Prueba con otro título o descripción." : "Agrega un pendiente y FRYD te ayudará a mantener el día bajo control."}
                  </p>
                  {!search && filter === "all" && (
                    <button type="button" onClick={openCreate} className="btn-secondary mt-4">
                      <PlusIcon /> Crear primera tarea
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-7 xl:sticky xl:top-8">
          <section className="fryd-panel p-5 sm:p-6">
            <p className="fryd-section-label">Tu progreso</p>
            <div className="mt-5 flex items-center gap-5">
              <div className="fryd-progress-ring" style={{ "--progress": `${completionRate * 3.6}deg` } as CSSProperties}>
                <div>
                  <strong>{completionRate}%</strong>
                  <span>completado</span>
                </div>
              </div>
              <div className="min-w-0 space-y-2 text-xs">
                <p className="text-[var(--color-text-secondary)]"><strong className="text-[var(--color-text-primary)] text-sm">{counts.completed}</strong> completadas</p>
                <p className="text-[var(--color-text-secondary)]"><strong className="text-amber-300 text-sm">{counts.in_progress}</strong> en progreso</p>
                <p className="text-[var(--color-text-secondary)]"><strong className="text-slate-300 text-sm">{counts.pending}</strong> pendientes</p>
              </div>
            </div>
            <div className="brand-progress-track h-2 rounded-full overflow-hidden mt-5">
              <div className="brand-progress-fill h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
            </div>
          </section>

          <section className="fryd-panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="fryd-section-label">Siguiente</p>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)] mt-1">Prioridad próxima</h2>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-400/10 border border-blue-400/15 text-blue-300 flex items-center justify-center">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 2v3M17 2v3M3 9h18" /><rect x="3" y="4" width="18" height="17" rx="3" /></svg>
              </div>
            </div>

            {nextTask ? (
              <div className="mt-5">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{nextTask.title}</p>
                {nextTask.description && <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{nextTask.description}</p>}
                <div className="mt-4 fryd-panel-subtle px-3.5 py-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-[var(--color-text-muted)]">Vence</span>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{formatTaskDate(nextTask.due_date)}</span>
                </div>
                <button type="button" className="fryd-link mt-4 inline-flex items-center gap-1.5" onClick={() => openEdit(nextTask)}>
                  Ver tarea <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : (
              <div className="mt-5 text-sm text-[var(--color-text-secondary)]">
                No tienes tareas próximas. Buen momento para planear lo siguiente.
              </div>
            )}
          </section>

          <section className="brand-outline rounded-[var(--radius-xl)] p-5 bg-[var(--color-surface-card)]">
            <div className="flex gap-3">
              <div className="w-9 h-9 flex-shrink-0 rounded-xl brand-gradient-soft text-indigo-300 flex items-center justify-center border border-indigo-400/15">✦</div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Consejo de FRYD</p>
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] mt-1.5">
                  Mantén pocas tareas “En progreso”. Terminar antes de abrir otro frente hace más visible tu avance.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={showModal}
        title={editingId ? "Editar tarea" : "Nueva tarea"}
        description={editingId ? "Actualiza los detalles sin perder el contexto de tu día." : "Convierte una intención en un siguiente paso claro."}
        icon={<TaskIcon />}
        onClose={closeModal}
        footer={(
          <>
            <button type="button" onClick={closeModal} className="btn-secondary sm:min-w-28">Cancelar</button>
            <button type="button" onClick={handleSubmit} className="btn-primary sm:min-w-36">
              {editingId ? "Guardar cambios" : "Crear tarea"}
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="task-title" className="fryd-field-label">Título</label>
            <input
              id="task-title"
              name="title"
              placeholder="Ej. Preparar presentación de FRYD"
              value={form.title}
              onChange={handleChange}
              className="fryd-input mt-2"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="task-description" className="fryd-field-label">Descripción <span>Opcional</span></label>
            <textarea
              id="task-description"
              name="description"
              placeholder="Agrega contexto, notas o el resultado que esperas conseguir."
              value={form.description}
              onChange={handleChange}
              className="fryd-input min-h-[105px] resize-none mt-2"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-date" className="fryd-field-label">Fecha límite</label>
              <input id="task-date" name="due_date" type="datetime-local" value={form.due_date} onChange={handleChange} className="fryd-input mt-2" />
            </div>
            <div>
              <label htmlFor="task-status" className="fryd-field-label">Estado</label>
              <select id="task-status" name="status" value={form.status} onChange={handleChange} className="fryd-input mt-2">
                <option value="pending">Pendiente</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completada</option>
              </select>
            </div>
          </div>

          {editingId && (
            <div className="rounded-xl border border-red-400/10 bg-red-400/[0.035] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Eliminar esta tarea</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
              <button type="button" onClick={() => editingId && handleDelete(editingId)} className="btn-danger self-start sm:self-auto">Eliminar</button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
