import { useEffect, useState } from "react";
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
} from "../../services/api";

type HabitLog = {
  id: number;
  habit_id: number;
  date: string;
  created_at: string;
};

type Habit = {
  id: number;
  name: string;
  description?: string;
  frequency: "daily" | "weekly" | "monthly";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  logs: HabitLog[];
};

const frequencyConfig = {
  daily: { label: "Diario", icon: "☀️", badge: "badge-green" },
  weekly: { label: "Semanal", icon: "📅", badge: "badge-blue" },
  monthly: { label: "Mensual", icon: "🗓️", badge: "badge-purple" },
};

const getLast35Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }
  return dates;
};

const formatDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isCompletedOnDate = (habit: Habit, dateStr: string) => {
  return habit.logs?.some((log) => log.date === dateStr);
};

const calculateStreak = (logs: HabitLog[]) => {
  if (!logs || logs.length === 0) return 0;
  
  const completedDates = new Set(logs.map(log => log.date));
  let streak = 0;
  let checkDate = new Date();
  
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  let dateStr = formatDate(checkDate);
  
  if (!completedDates.has(dateStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    dateStr = formatDate(checkDate);
  }
  
  while (completedDates.has(dateStr)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    dateStr = formatDate(checkDate);
  }
  
  return streak;
};


export default function HabitPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    frequency: "daily",
    status: "active",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadHabits();
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

  const loadHabits = async () => {
    try {
      const data = await getHabits();
      setHabits(data);
    } catch {
      setErrorMessage("Error al cargar hábitos");
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", frequency: "daily", status: "active" });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setForm({
      name: habit.name || "",
      description: habit.description || "",
      frequency: habit.frequency || "daily",
      status: habit.status || "active",
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

    if (!form.name.trim()) {
      setErrorMessage("El hábito debe tener un nombre.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        frequency: form.frequency,
        status: form.status,
      };

      if (editingId) {
        await updateHabit(editingId, payload);
        setSuccessMessage("Hábito actualizado");
      } else {
        await createHabit(payload);
        setSuccessMessage("Hábito creado");
      }

      resetForm();
      setShowModal(false);
      loadHabits();
    } catch {
      setErrorMessage("Error al guardar el hábito");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este hábito?")) return;
    try {
      await deleteHabit(id);
      if (editingId === id) resetForm();
      setSuccessMessage("Hábito eliminado");
      setShowModal(false);
      loadHabits();
    } catch {
      setErrorMessage("Error al eliminar");
    }
  };

  const handleToggleStatus = async (habit: Habit) => {
    try {
      await updateHabit(habit.id, {
        status: habit.status === "active" ? "inactive" : "active",
      });
      loadHabits();
    } catch {
      setErrorMessage("Error al cambiar estado");
    }
  };

  const handleToggleLog = async (habitId: number, dateStr: string) => {
    try {
      await toggleHabitLog(habitId, dateStr);
      loadHabits();
    } catch {
      setErrorMessage("Error al registrar cumplimiento del hábito");
    }
  };


  const activeHabits = habits.filter((h) => h.status === "active");
  const inactiveHabits = habits.filter((h) => h.status === "inactive");



  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mis Hábitos</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Construye rutinas que te ayuden a mejorar cada día.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary self-start sm:self-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo hábito
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-static text-center py-4">
          <p className="text-2xl font-bold text-[var(--color-accent-primary)]">{activeHabits.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Activos</p>
        </div>
        <div className="card-static text-center py-4">
          <p className="text-2xl font-bold text-[var(--color-text-secondary)]">{inactiveHabits.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Inactivos</p>
        </div>
        <div className="card-static text-center py-4">
          <p className="text-2xl font-bold text-[var(--color-accent-secondary)]">{habits.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Total</p>
        </div>
      </div>

      {/* Active habits */}
      {activeHabits.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            Hábitos activos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeHabits.map((habit, i) => {
              const freq = frequencyConfig[habit.frequency];

              return (
                <div
                  key={habit.id}
                  className="card-static animate-slide-in-up group flex flex-col gap-4"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggleStatus(habit)}
                      className="mt-0.5 w-5 h-5 rounded-md bg-[var(--color-accent-primary)] flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                      title="Desactivar hábito"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
                          {habit.name}
                        </h3>
                        <span className={`badge ${freq.badge} flex-shrink-0`}>
                          {freq.label}
                        </span>
                      </div>

                      {habit.description && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Heatmap Section */}
                  <div className="border-t border-[var(--color-border)] pt-3 mt-1">
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 flex items-center justify-between">
                      <span>Historial (Últimos 35 días)</span>
                      <span className="text-[var(--color-accent-secondary)] flex items-center gap-1 font-medium">
                        🔥 Racha: {calculateStreak(habit.logs)} {calculateStreak(habit.logs) === 1 ? 'día' : 'días'}
                      </span>
                    </p>
                    <div className="grid grid-cols-7 gap-1 max-w-[240px] mx-auto sm:mx-0">
                      {getLast35Days().map((date) => {
                        const dateStr = formatDateStr(date);
                        const completed = isCompletedOnDate(habit, dateStr);
                        const isTodayDate = formatDateStr(new Date()) === dateStr;
                        return (
                          <button
                            key={dateStr}
                            onClick={() => handleToggleLog(habit.id, dateStr)}
                            className={`aspect-square w-full rounded-sm text-[9px] font-semibold flex items-center justify-center transition-all hover:scale-110 ${
                              completed
                                ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-sm shadow-[var(--color-accent-primary)]/20"
                                : "bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)]"
                            } ${isTodayDate ? "ring-2 ring-[var(--color-accent-secondary)]" : ""}`}
                            title={`${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}: ${completed ? 'Completado' : 'No completado'}`}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-border)]">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Total: {habit.logs?.length || 0} completado{habit.logs?.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(habit)} className="btn-ghost text-xs py-1 px-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(habit.id)} className="btn-danger text-xs py-1 px-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive habits */}
      {inactiveHabits.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            Inactivos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactiveHabits.map((habit) => {
              const freq = frequencyConfig[habit.frequency];

              return (
                <div key={habit.id} className="card-static opacity-60 hover:opacity-100 transition-opacity group">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleStatus(habit)}
                      className="mt-0.5 w-5 h-5 rounded-md border-2 border-[var(--color-text-muted)] flex items-center justify-center flex-shrink-0 transition-all hover:border-[var(--color-accent-primary)] hover:scale-110"
                      title="Activar hábito"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm text-[var(--color-text-muted)] line-through">
                          {habit.name}
                        </h3>
                        <span className="badge badge-gray flex-shrink-0">{freq.label}</span>
                      </div>

                      {habit.description && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-1">
                          {habit.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1 mt-3 ml-auto opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(habit)} className="btn-ghost text-xs py-1 px-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(habit.id)} className="btn-danger text-xs py-1 px-2">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="empty-state py-16">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
            <path d="M12 8v4l3 3" />
          </svg>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            No hay hábitos aún
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Crea tu primer hábito para comenzar a mejorar
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content card-static" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {editingId ? "Editar hábito" : "Nuevo hábito"}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-ghost p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Nombre</label>
                <input
                  name="name"
                  placeholder="¿Qué hábito quieres formar?"
                  value={form.name}
                  onChange={handleChange}
                  className="fryd-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Descripción</label>
                <textarea
                  name="description"
                  placeholder="Describe tu hábito (opcional)"
                  value={form.description}
                  onChange={handleChange}
                  className="fryd-input min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Frecuencia</label>
                  <select name="frequency" value={form.frequency} onChange={handleChange} className="fryd-input">
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Estado</label>
                  <select name="status" value={form.status} onChange={handleChange} className="fryd-input">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={handleSubmit} className="btn-primary flex-1">
                  {editingId ? "Actualizar" : "Crear hábito"}
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