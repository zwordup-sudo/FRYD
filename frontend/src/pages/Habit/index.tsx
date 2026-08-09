import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitLog,
} from "../../services/api";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import SegmentedTabs from "../../components/ui/SegmentedTabs";
import StatTile from "../../components/ui/StatTile";

type HabitLog = {
  id: number;
  habit_id: number;
  date: string;
  created_at: string;
};

type HabitFrequency = "daily" | "weekly" | "monthly";
type HabitStatus = "active" | "inactive";
type HabitFilter = "active" | "all" | "inactive";

type Habit = {
  id: number;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  status: HabitStatus;
  created_at: string;
  updated_at: string;
  logs: HabitLog[];
};

type HabitForm = {
  name: string;
  description: string;
  frequency: HabitFrequency;
  status: HabitStatus;
};

const emptyForm: HabitForm = {
  name: "",
  description: "",
  frequency: "daily",
  status: "active",
};

const frequencyConfig: Record<HabitFrequency, { label: string; badge: string; detail: string }> = {
  daily: { label: "Diario", badge: "badge-green", detail: "Todos los días" },
  weekly: { label: "Semanal", badge: "badge-blue", detail: "Una vez por semana" },
  monthly: { label: "Mensual", badge: "badge-purple", detail: "Una vez por mes" },
};

const expectedCheckins: Record<HabitFrequency, number> = {
  daily: 35,
  weekly: 5,
  monthly: 2,
};

const formatDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayString = () => formatDateStr(new Date());

const getLast35Days = () => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 34; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  return dates;
};

const isCompletedOnDate = (habit: Habit, dateStr: string) =>
  habit.logs?.some((log) => log.date === dateStr) ?? false;

const calculateStreak = (logs: HabitLog[]) => {
  if (!logs || logs.length === 0) return 0;

  const completedDates = new Set(logs.map((log) => log.date));
  let streak = 0;
  const checkDate = new Date();
  let dateStr = formatDateStr(checkDate);

  if (!completedDates.has(dateStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    dateStr = formatDateStr(checkDate);
  }

  while (completedDates.has(dateStr)) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
    dateStr = formatDateStr(checkDate);
  }

  return streak;
};

const calculateConsistency = (habit: Habit, periodDays: Date[]) => {
  const visibleDates = new Set(periodDays.map(formatDateStr));
  const completed = new Set(
    (habit.logs || []).filter((log) => visibleDates.has(log.date)).map((log) => log.date)
  ).size;
  const expected = expectedCheckins[habit.frequency];
  return Math.min(100, Math.round((completed / expected) * 100));
};

const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const HabitIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a9 9 0 1 0 9 9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const SparkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12 3-1.1 3.1a4 4 0 0 1-2.5 2.5L5.3 9.7l3.1 1.1a4 4 0 0 1 2.5 2.5L12 16.4l1.1-3.1a4 4 0 0 1 2.5-2.5l3.1-1.1-3.1-1.1a4 4 0 0 1-2.5-2.5L12 3Z" />
    <path d="m18 15-.55 1.55a2 2 0 0 1-1.25 1.25l-1.55.55 1.55.55a2 2 0 0 1 1.25 1.25L18 21.7l.55-1.55a2 2 0 0 1 1.25-1.25l1.55-.55-1.55-.55a2 2 0 0 1-1.25-1.25L18 15Z" />
  </svg>
);

export default function HabitPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [filter, setFilter] = useState<HabitFilter>("active");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<HabitForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const periodDays = useMemo(() => getLast35Days(), []);

  const loadHabits = async () => {
    try {
      const data = await getHabits();
      setHabits(data);
    } catch {
      setErrorMessage("Error al cargar hábitos");
    }
  };

  useEffect(() => {
    loadHabits();
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

  const openEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setForm({
      name: habit.name || "",
      description: habit.description || "",
      frequency: habit.frequency || "daily",
      status: habit.status || "active",
    });
    setOpenMenuId(null);
    setErrorMessage("");
    setShowModal(true);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value } as HabitForm));
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

      closeModal();
      loadHabits();
    } catch {
      setErrorMessage("Error al guardar el hábito");
    }
  };

  const handleDelete = async (id: number) => {
    setOpenMenuId(null);
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
      setHabits((current) =>
        current.map((item) =>
          item.id === habit.id
            ? { ...item, status: item.status === "active" ? "inactive" : "active" }
            : item
        )
      );
    } catch {
      setErrorMessage("Error al cambiar estado");
    }
  };

  const handleToggleLog = async (habitId: number, dateStr: string) => {
    try {
      await toggleHabitLog(habitId, dateStr);
      await loadHabits();
    } catch {
      setErrorMessage("Error al registrar cumplimiento del hábito");
    }
  };

  const activeHabits = habits.filter((habit) => habit.status === "active");
  const inactiveHabits = habits.filter((habit) => habit.status === "inactive");
  const today = todayString();
  const completedToday = activeHabits.filter((habit) => isCompletedOnDate(habit, today)).length;
  const bestStreak = habits.reduce((best, habit) => Math.max(best, calculateStreak(habit.logs)), 0);
  const averageConsistency = activeHabits.length
    ? Math.round(
        activeHabits.reduce((sum, habit) => sum + calculateConsistency(habit, periodDays), 0) /
          activeHabits.length
      )
    : 0;

  const visibleHabits = habits.filter((habit) => {
    if (filter === "all") return true;
    return habit.status === filter;
  });

  const tabs: Array<{ key: HabitFilter; label: string; count?: number }> = [
    { key: "active" as const, label: "Activos", count: activeHabits.length },
    { key: "all" as const, label: "Todos", count: habits.length },
    { key: "inactive" as const, label: "Pausados", count: inactiveHabits.length },
  ];

  const todayRate = activeHabits.length ? Math.round((completedToday / activeHabits.length) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Rutinas"
        title="Mis hábitos"
        description="Construye constancia con pequeñas acciones y observa cómo evoluciona tu ritmo día a día."
        action={
          <button type="button" onClick={openCreate} className="btn-primary">
            <PlusIcon />
            Nuevo hábito
          </button>
        }
      />

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

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-6 mb-9">
        <StatTile
          label="Hábitos activos"
          value={activeHabits.length}
          detail={activeHabits.length === 1 ? "rutina en marcha" : "rutinas en marcha"}
          tone="brand"
          icon={<HabitIcon />}
        />
        <StatTile
          label="Completados hoy"
          value={`${completedToday}/${activeHabits.length}`}
          detail={`${todayRate}% de tu día`}
          tone="success"
          icon={<span className="text-base">✓</span>}
        />
        <StatTile
          label="Constancia"
          value={`${averageConsistency}%`}
          detail="promedio · últimos 35 días"
          tone="brand"
          icon={<SparkIcon />}
        />
        <StatTile
          label="Mejor racha"
          value={`${bestStreak} ${bestStreak === 1 ? "día" : "días"}`}
          detail="racha actual más alta"
          tone="warning"
          icon={<span className="text-base">🔥</span>}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem] gap-x-5 gap-y-9 items-start">
        <section className="min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <SegmentedTabs<HabitFilter> tabs={tabs} value={filter} onChange={setFilter} />
            <p className="text-xs text-[var(--color-text-muted)]">
              Toca cualquier día para registrar o corregir tu historial.
            </p>
          </div>

          {visibleHabits.length > 0 ? (
            <div className="space-y-4">
              {visibleHabits.map((habit, index) => {
                const frequency = frequencyConfig[habit.frequency];
                const streak = calculateStreak(habit.logs);
                const consistency = calculateConsistency(habit, periodDays);
                const isTodayDone = isCompletedOnDate(habit, today);
                const isInactive = habit.status === "inactive";

                return (
                  <article
                    key={habit.id}
                    className={`fryd-habit-card animate-slide-in-up ${isInactive ? "is-inactive" : ""}`}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <button
                        type="button"
                        className={`fryd-habit-today ${isTodayDone ? "is-completed" : ""}`}
                        onClick={() => handleToggleLog(habit.id, today)}
                        disabled={isInactive}
                        title={isInactive ? "Activa el hábito para registrarlo" : isTodayDone ? "Desmarcar hoy" : "Marcar como hecho hoy"}
                        aria-label={isTodayDone ? `Desmarcar ${habit.name} hoy` : `Marcar ${habit.name} como hecho hoy`}
                      >
                        {isTodayDone ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>
                        ) : (
                          <span />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-[0.95rem] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]">
                                {habit.name}
                              </h2>
                              <span className={`badge ${isInactive ? "badge-gray" : frequency.badge}`}>{frequency.label}</span>
                              {isInactive && <span className="badge badge-gray">Pausado</span>}
                            </div>
                            {habit.description && (
                              <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
                                {habit.description}
                              </p>
                            )}
                          </div>

                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              className="fryd-icon-button"
                              aria-label={`Opciones para ${habit.name}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMenuId((current) => (current === habit.id ? null : habit.id));
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                            </button>
                            {openMenuId === habit.id && (
                              <div className="fryd-context-menu" onClick={(event) => event.stopPropagation()}>
                                <button type="button" onClick={() => openEdit(habit)}>
                                  <span>✎</span>
                                  Editar hábito
                                </button>
                                <button type="button" onClick={() => handleToggleStatus(habit)}>
                                  <span>{isInactive ? "▶" : "Ⅱ"}</span>
                                  {isInactive ? "Reactivar" : "Pausar"}
                                </button>
                                <button type="button" className="is-danger" onClick={() => handleDelete(habit.id)}>
                                  <span>⌫</span>
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_10.5rem] gap-4 items-end">
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-2.5">
                              <div>
                                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Últimos 35 días</p>
                                <p className="text-[0.68rem] text-[var(--color-text-muted)] mt-0.5">{frequency.detail}</p>
                              </div>
                              <div className="flex items-center gap-3 text-[0.68rem] text-[var(--color-text-muted)]">
                                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-[3px] bg-[var(--color-accent-tertiary)]" /> Hecho</span>
                                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-[3px] border border-[var(--color-border-default)]" /> Pendiente</span>
                              </div>
                            </div>

                            <div className="fryd-habit-heatmap-wrap">
                              <div className="fryd-habit-weekdays" aria-hidden="true">
                                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, dayIndex) => <span key={`${day}-${dayIndex}`}>{day}</span>)}
                              </div>
                              <div className="fryd-habit-heatmap">
                                {periodDays.map((date) => {
                                  const dateStr = formatDateStr(date);
                                  const completed = isCompletedOnDate(habit, dateStr);
                                  const isTodayDate = dateStr === today;
                                  return (
                                    <button
                                      type="button"
                                      key={dateStr}
                                      onClick={() => handleToggleLog(habit.id, dateStr)}
                                      disabled={isInactive}
                                      className={`fryd-habit-day ${completed ? "is-completed" : ""} ${isTodayDate ? "is-today" : ""}`}
                                      title={`${date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}: ${completed ? "Completado" : "Sin registro"}`}
                                      aria-label={`${date.toLocaleDateString("es-MX")}: ${completed ? "completado" : "sin completar"}`}
                                    >
                                      <span>{date.getDate()}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="fryd-habit-metrics">
                            <div>
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="text-[var(--color-text-muted)]">Constancia</span>
                                <strong className="text-[var(--color-text-primary)]">{consistency}%</strong>
                              </div>
                              <div className="fryd-habit-progress mt-2" aria-label={`Constancia ${consistency}%`}>
                                <span style={{ width: `${consistency}%` }} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div className="fryd-habit-mini-stat">
                                <span>🔥</span>
                                <strong>{streak}</strong>
                                <small>racha</small>
                              </div>
                              <div className="fryd-habit-mini-stat">
                                <span>✓</span>
                                <strong>{habit.logs?.length || 0}</strong>
                                <small>registros</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="fryd-panel py-14 px-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl brand-gradient-soft border border-[var(--color-border-accent)] flex items-center justify-center text-[#aeb4ff]">
                <HabitIcon />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
                {habits.length === 0 ? "Tu primera rutina empieza aquí" : "No hay hábitos en esta vista"}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
                {habits.length === 0
                  ? "Crea un hábito sencillo, marca tus avances y deja que FRYD te ayude a visualizar la constancia."
                  : "Cambia de filtro para ver el resto de tus hábitos."}
              </p>
              {habits.length === 0 && (
                <button type="button" onClick={openCreate} className="btn-primary mt-5">
                  <PlusIcon />
                  Crear primer hábito
                </button>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-7 xl:sticky xl:top-6">
          <div className="fryd-panel p-5">
            <p className="fryd-section-label">Ritmo de hoy</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="fryd-progress-ring" style={{ "--progress": `${todayRate * 3.6}deg` } as CSSProperties}>
                <div>
                  <strong>{todayRate}%</strong>
                  <span>hoy</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {activeHabits.length === 0
                    ? "Sin hábitos activos"
                    : completedToday === activeHabits.length
                      ? "Día completado"
                      : completedToday === 0
                        ? "Aún puedes empezar"
                        : "Vas tomando ritmo"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {activeHabits.length === 0
                    ? "Activa o crea una rutina para comenzar."
                    : `${completedToday} de ${activeHabits.length} hábitos registrados hoy.`}
                </p>
              </div>
            </div>
          </div>

          <div className="fryd-panel p-5 overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-28 h-28 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[#aaaefc]">
                <SparkIcon />
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Clave de constancia</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                La mejor rutina no es la más ambiciosa: es la que puedes repetir incluso en un día difícil.
              </p>
              <div className="mt-4 rounded-xl border border-[var(--color-border-subtle)] bg-white/[0.025] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">Promedio 35 días</span>
                  <strong className="brand-gradient-text">{averageConsistency}%</strong>
                </div>
                <div className="fryd-habit-progress mt-2.5">
                  <span style={{ width: `${averageConsistency}%` }} />
                </div>
              </div>
            </div>
          </div>

          {inactiveHabits.length > 0 && filter !== "inactive" && (
            <button
              type="button"
              onClick={() => setFilter("inactive")}
              className="w-full fryd-panel-subtle p-4 text-left fryd-panel-interactive"
            >
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">{inactiveHabits.length} hábito{inactiveHabits.length === 1 ? "" : "s"} en pausa</p>
              <p className="text-[0.7rem] text-[var(--color-text-muted)] mt-1">Revisa o reactiva rutinas anteriores →</p>
            </button>
          )}
        </aside>
      </div>

      <Modal
        open={showModal}
        title={editingId ? "Editar hábito" : "Nuevo hábito"}
        description={editingId ? "Ajusta la rutina sin perder su historial." : "Empieza con una acción concreta que puedas repetir."}
        icon={<HabitIcon />}
        onClose={closeModal}
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
            <button type="button" onClick={handleSubmit} className="btn-primary">
              {editingId ? "Guardar cambios" : "Crear hábito"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="fryd-field-label mb-1.5">Nombre <span>Obligatorio</span></span>
            <input
              name="name"
              placeholder="Ej. Meditar 10 minutos"
              value={form.name}
              onChange={handleChange}
              className="fryd-input"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="fryd-field-label mb-1.5">Descripción <span>Opcional</span></span>
            <textarea
              name="description"
              placeholder="¿Qué significa cumplir este hábito?"
              value={form.description}
              onChange={handleChange}
              className="fryd-input min-h-[92px] resize-none"
              rows={3}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="fryd-field-label mb-1.5">Frecuencia</span>
              <select name="frequency" value={form.frequency} onChange={handleChange} className="fryd-input">
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </label>

            <label className="block">
              <span className="fryd-field-label mb-1.5">Estado</span>
              <select name="status" value={form.status} onChange={handleChange} className="fryd-input">
                <option value="active">Activo</option>
                <option value="inactive">Pausado</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-white/[0.025] px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg brand-gradient-soft flex items-center justify-center text-[#aaaefc] flex-shrink-0">
              <SparkIcon />
            </div>
            <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
              Consejo: define el hábito de forma que puedas saber claramente si lo hiciste o no. “Leer 10 minutos” funciona mejor que “leer más”.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
