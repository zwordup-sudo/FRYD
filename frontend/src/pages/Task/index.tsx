import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../../services/api";

type Task = {
  id: number;
  title: string;
  description?: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
};

type FilterStatus = "all" | "pending" | "in_progress" | "completed";

const formatTaskDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusConfig = {
  pending: { label: "Pendiente", badge: "badge-gray", dot: "status-dot bg-[var(--color-text-muted)]" },
  in_progress: { label: "En progreso", badge: "badge-yellow", dot: "status-dot status-dot-warning" },
  completed: { label: "Completado", badge: "badge-green", dot: "status-dot status-dot-active" },
};

const getDueUrgency = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);
  const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft < 0) return "overdue";
  if (hoursLeft < 24) return "urgent";
  if (hoursLeft < 72) return "soon";
  return "normal";
};

const urgencyStyles = {
  overdue: "border-l-[var(--color-accent-danger)] text-[var(--color-accent-danger)]",
  urgent: "border-l-[var(--color-accent-warning)] text-[var(--color-accent-warning)]",
  soon: "border-l-[var(--color-accent-info)] text-[var(--color-accent-info)]",
  normal: "border-l-[var(--color-border-default)] text-[var(--color-text-muted)]",
};

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "pending",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
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
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const resetForm = () => {
    setForm({ title: "", description: "", due_date: "", status: "pending" });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
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
    setErrorMessage("");
    setSuccessMessage("");
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

      resetForm();
      setShowModal(false);
      loadTasks();
    } catch {
      setErrorMessage("Error al guardar la tarea");
    }
  };

  const handleDelete = async (id: number) => {
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

  const handleQuickStatus = async (task: Task, newStatus: Task["status"]) => {
    try {
      await updateTask(task.id, { status: newStatus });
      loadTasks();
    } catch {
      setErrorMessage("Error al actualizar estado");
    }
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: tasks.length },
    { key: "pending", label: "Pendientes", count: tasks.filter((t) => t.status === "pending").length },
    { key: "in_progress", label: "En progreso", count: tasks.filter((t) => t.status === "in_progress").length },
    { key: "completed", label: "Completadas", count: tasks.filter((t) => t.status === "completed").length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mis Tareas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Organiza tus pendientes y mantén el control de tu día.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary self-start sm:self-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva tarea
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

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
              transition-all duration-200
              ${
                filter === f.key
                  ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-md"
                  : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-accent)] hover:text-[var(--color-text-primary)]"
              }
            `}
          >
            {f.label}
            <span className={`
              text-xs px-1.5 py-0.5 rounded-full
              ${filter === f.key ? "bg-white/20" : "bg-[var(--color-surface-input)]"}
            `}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map((task, i) => {
          const urgency = task.status === "completed" ? "normal" : getDueUrgency(task.due_date);
          const config = statusConfig[task.status];

          return (
            <div
              key={task.id}
              className={`
                card-static border-l-[3px] animate-slide-in-up
                ${urgencyStyles[urgency].split(" ")[0]}
              `}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Status checkbox */}
                <button
                  onClick={() =>
                    handleQuickStatus(
                      task,
                      task.status === "completed"
                        ? "pending"
                        : task.status === "in_progress"
                        ? "completed"
                        : "in_progress"
                    )
                  }
                  className={`
                    mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                    transition-all duration-200
                    ${
                      task.status === "completed"
                        ? "bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]"
                        : task.status === "in_progress"
                        ? "border-[var(--color-accent-warning)] bg-[var(--color-accent-warning)]/10"
                        : "border-[var(--color-text-muted)] hover:border-[var(--color-accent-primary)]"
                    }
                  `}
                  title={
                    task.status === "completed"
                      ? "Marcar como pendiente"
                      : task.status === "in_progress"
                      ? "Marcar como completada"
                      : "Marcar como en progreso"
                  }
                >
                  {task.status === "completed" && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                  )}
                  {task.status === "in_progress" && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent-warning)]" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold text-sm ${task.status === "completed" ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]"}`}>
                      {task.title}
                    </h3>
                    <span className={`badge ${config.badge} flex-shrink-0`}>
                      {config.label}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <span className={`text-xs flex items-center gap-1.5 ${urgencyStyles[urgency].split(" ").slice(1).join(" ")}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      {formatTaskDate(task.due_date)}
                    </span>

                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={() => openEdit(task)} className="btn-ghost text-xs py-1 px-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="btn-danger text-xs py-1 px-2">
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

        {filteredTasks.length === 0 && (
          <div className="empty-state py-16">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
              {filter === "all" ? "No hay tareas aún" : `No hay tareas ${filters.find(f => f.key === filter)?.label.toLowerCase()}`}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {filter === "all" && "Crea tu primera tarea para comenzar"}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content card-static" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {editingId ? "Editar tarea" : "Nueva tarea"}
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
                  placeholder="¿Qué necesitas hacer?"
                  value={form.title}
                  onChange={handleChange}
                  className="fryd-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Descripción</label>
                <textarea
                  name="description"
                  placeholder="Agrega detalles (opcional)"
                  value={form.description}
                  onChange={handleChange}
                  className="fryd-input min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Fecha límite</label>
                  <input
                    name="due_date"
                    type="datetime-local"
                    value={form.due_date}
                    onChange={handleChange}
                    className="fryd-input"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Estado</label>
                  <select name="status" value={form.status} onChange={handleChange} className="fryd-input">
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={handleSubmit} className="btn-primary flex-1">
                  {editingId ? "Actualizar" : "Crear tarea"}
                </button>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}