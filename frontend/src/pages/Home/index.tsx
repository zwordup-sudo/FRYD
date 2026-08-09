import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks, getHabits, getDiaryEntries } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

type Task = {
  id: number;
  title: string;
  status: "pending" | "in_progress" | "completed";
  due_date: string;
};

type Habit = {
  id: number;
  name: string;
  status: "active" | "inactive";
  frequency: string;
};

type DiaryEntry = {
  id: number;
  title?: string;
  mood?: string;
  energy_level?: number;
  created_at: string;
};

const moodEmoji: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  annoyed: "😤",
  excited: "🤩",
  neutral: "😐",
  stressed: "😰",
  calm: "😌",
};

const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = async () => {
    try {
      const [tasksData, habitsData, diaryData] = await Promise.all([
        getTasks(),
        getHabits(),
        getDiaryEntries(),
      ]);
      setTasks(tasksData);
      setHabits(habitsData);
      setEntries(diaryData);
    } catch {
      setErrorMessage("Error al cargar el resumen de FRYD");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
  const activeHabits = habits.filter((habit) => habit.status === "active").length;
  const taskProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const displayName = (user?.username || user?.email?.split("@")[0] || "").trim();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getStreak = () => {
    if (!entries.length) return 0;
    const dates = Array.from(new Set(entries.map((entry) => entry.created_at.split("T")[0]))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let cursor = new Date();
    if (!dates.includes(todayStr)) {
      if (!dates.includes(yesterdayStr)) return 0;
      cursor = yesterday;
    }

    let streak = 0;
    while (dates.includes(cursor.toISOString().split("T")[0])) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };

  const weekDays = useMemo(() => {
    const current = new Date();
    const dayOfWeek = current.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);
    const entryDates = new Set(entries.map((entry) => entry.created_at.split("T")[0]));
    const labels = ["L", "M", "M", "J", "V", "S", "D"];
    const todayStr = new Date().toISOString().split("T")[0];

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateStr = date.toISOString().split("T")[0];
      return {
        label: labels[index],
        hasEntry: entryDates.has(dateStr),
        isToday: dateStr === todayStr,
      };
    });
  }, [entries]);

  const orderedTasks = useMemo(() => {
    const score = (task: Task) => (task.status === "completed" ? 2 : task.status === "in_progress" ? 0 : 1);
    return [...tasks]
      .sort((a, b) => {
        const byStatus = score(a) - score(b);
        if (byStatus !== 0) return byStatus;
        const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 4);
  }, [tasks]);

  const upcomingTask = useMemo(() => {
    const now = Date.now();
    return [...tasks]
      .filter((task) => task.status !== "completed" && task.due_date && new Date(task.due_date).getTime() >= now)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  }, [tasks]);

  const latestEntry = useMemo(
    () => [...entries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0],
    [entries]
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Sin fecha";
    const todayDate = new Date();
    const sameDay = date.toDateString() === todayDate.toDateString();
    return `${sameDay ? "Hoy · " : ""}${date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const formatEntryTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const insight = (() => {
    if (!tasks.length && !entries.length && !habits.length) {
      return "Tu espacio está listo. Agrega tu primera tarea, hábito o reflexión para que FRYD empiece a construir contexto contigo.";
    }
    if (completedTasks > 0 && entries.length > 0) {
      return `Llevas ${completedTasks} tarea${completedTasks === 1 ? "" : "s"} completada${completedTasks === 1 ? "" : "s"} y ${entries.length} registro${entries.length === 1 ? "" : "s"} de diario. Mantener ambos hábitos te dará una lectura más completa de tu progreso.`;
    }
    if (activeHabits > 0) {
      return `Tienes ${activeHabits} hábito${activeHabits === 1 ? "" : "s"} activo${activeHabits === 1 ? "" : "s"}. La constancia diaria hará que tus analíticas sean cada vez más útiles.`;
    }
    return "Ya tienes actividad en FRYD. Completa tus pendientes y registra cómo te fue para conectar productividad y reflexión.";
  })();

  const quickActions = [
    {
      label: "Nueva tarea",
      route: "/task",
      background: "linear-gradient(145deg, #6841e8 0%, #4338ca 100%)",
      icon: <path d="M12 5v14M5 12h14" />,
    },
    {
      label: "Nuevo hábito",
      route: "/habit",
      background: "linear-gradient(145deg, #2f7df4 0%, #1859c9 100%)",
      icon: <><path d="M20 12a8 8 0 11-2.34-5.66" /><path d="M20 4v5h-5" /></>,
    },
    {
      label: "Nueva entrada",
      route: "/diary",
      background: "linear-gradient(145deg, #0f6e75 0%, #0c4f58 100%)",
      icon: <><path d="M5 4.5A2.5 2.5 0 017.5 2H20v17H7.5A2.5 2.5 0 005 21.5v-17z" /><path d="M5 4.5v17" /></>,
    },
    {
      label: "Preguntar a FRYD",
      route: "/assistant",
      background: "linear-gradient(145deg, #1c2a50 0%, #151f3c 100%)",
      icon: <><path d="M12 3l1.05 3.02A4.7 4.7 0 0016 8.95L19 10l-3 1.05A4.7 4.7 0 0013.05 14L12 17l-1.05-3A4.7 4.7 0 008 11.05L5 10l3-1.05A4.7 4.7 0 0010.95 6L12 3z" /></>,
    },
  ];

  return (
    <div className="animate-fade-in pb-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-9">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
            {greeting()}{displayName ? `, ${displayName}` : ""} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] capitalize">{today}</p>
        </div>
        <button onClick={() => navigate("/assistant")} className="brand-outline rounded-2xl px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-white/[0.025] transition-colors inline-flex items-center justify-center gap-2 self-start">
          <span className="brand-gradient-text text-lg">✦</span>
          Preguntar a FRYD
        </button>
      </header>

      {errorMessage && <div className="alert alert-error mb-6">{errorMessage}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-x-6 gap-y-10">
        <div className="space-y-10 min-w-0">
          <section className="fryd-panel p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">¿Qué quieres avanzar hoy?</h2>
            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.route, action.route === "/assistant" ? undefined : { state: { openCreate: true } })}
                  className="quick-action-tile p-4 flex flex-col items-center justify-center gap-4 text-center"
                  style={{ background: action.background }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {action.icon}
                  </svg>
                  <span className="text-sm font-semibold">{action.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="fryd-panel p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Tu día</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Progreso de objetivos</p>
              </div>
              <span className="badge badge-purple">{taskProgress}% tareas</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[12rem_minmax(0,1fr)] gap-6 items-center">
              <div className="flex justify-center lg:border-r lg:border-[var(--color-border-subtle)] lg:pr-6">
                <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160" aria-label={`${completedTasks} de ${tasks.length} tareas completadas`}>
                    <defs>
                      <linearGradient id="frydProgressGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="52%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#14B8A6" />
                      </linearGradient>
                    </defs>
                    <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(148,163,184,.10)" strokeWidth="10" />
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      fill="none"
                      stroke="url(#frydProgressGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 64}
                      strokeDashoffset={2 * Math.PI * 64 * (1 - taskProgress / 100)}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--color-text-primary)]">{completedTasks} / {tasks.length}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">completadas</span>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                {orderedTasks.length ? (
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {orderedTasks.map((task) => {
                      const completed = task.status === "completed";
                      return (
                        <button key={task.id} onClick={() => navigate("/task")} className="w-full py-3 first:pt-0 last:pb-0 flex items-center gap-3 text-left group">
                          <span className={`w-5 h-5 rounded-full flex-shrink-0 border flex items-center justify-center ${completed ? "bg-[var(--color-accent-success)] border-[var(--color-accent-success)] text-[#07101f]" : "border-[#42516d] group-hover:border-[#7c83ff]"}`}>
                            {completed && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l4 4L19 6" /></svg>
                            )}
                          </span>
                          <span className={`min-w-0 flex-1 truncate text-sm font-medium ${completed ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text-primary)]"}`}>{task.title}</span>
                          <span className="hidden sm:block text-xs text-[var(--color-text-muted)] whitespace-nowrap">{formatTime(task.due_date)}</span>
                          <span className={`badge ${task.status === "in_progress" ? "badge-yellow" : completed ? "badge-green" : "badge-purple"}`}>
                            {task.status === "in_progress" ? "En progreso" : completed ? "Hecha" : "Pendiente"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border-default)] py-8 px-5 text-center">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Tu día está despejado.</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">Agrega una tarea para empezar a construir tu progreso.</p>
                    <button onClick={() => navigate("/task", { state: { openCreate: true } })} className="mt-4 fryd-link inline-flex items-center gap-2">Crear tarea <Arrow /></button>
                  </div>
                )}
                {tasks.length > 0 && (
                  <button onClick={() => navigate("/task")} className="mt-5 fryd-link inline-flex items-center gap-2">Ver todas mis tareas <Arrow /></button>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-7">
            <article className="fryd-panel fryd-panel-interactive p-5 min-h-48">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#9da5ff]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8.5 12l2.2 2.2L15.8 9"/></svg>
                  </span>
                  <h3 className="font-semibold">Tareas</h3>
                </div>
                <button onClick={() => navigate("/task")} className="fryd-link inline-flex items-center gap-1">Ver todas <Arrow /></button>
              </div>
              <p className="mt-5 text-3xl font-bold">{pendingTasks + inProgressTasks}</p>
              <p className="text-xs text-[var(--color-text-muted)]">pendientes</p>
              <div className="brand-progress-track h-2 rounded-full overflow-hidden mt-4">
                <div className="brand-progress-fill h-full rounded-full" style={{ width: `${taskProgress}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]"><strong className="text-[#9da5ff] text-base mr-1">{inProgressTasks}</strong> En progreso</span>
                <span className="text-[var(--color-text-secondary)]"><strong className="text-[var(--color-accent-success)] text-base mr-1">{completedTasks}</strong> Completadas</span>
              </div>
            </article>

            <article className="fryd-panel fryd-panel-interactive p-5 min-h-48">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#60a5fa]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 12a8 8 0 11-2.34-5.66"/><path d="M20 4v5h-5"/></svg>
                  </span>
                  <h3 className="font-semibold">Hábitos</h3>
                </div>
                <button onClick={() => navigate("/habit")} className="fryd-link inline-flex items-center gap-1">Ver todos <Arrow /></button>
              </div>
              <p className="mt-5 text-3xl font-bold">{activeHabits}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{activeHabits === 1 ? "activo" : "activos"}</p>
              <div className="mt-5 flex justify-between">
                {weekDays.map((day, index) => (
                  <div key={`${day.label}-${index}`} className="flex flex-col items-center gap-2">
                    <span className={`text-[10px] ${day.isToday ? "text-[#9da5ff] font-bold" : "text-[var(--color-text-muted)]"}`}>{day.label}</span>
                    <span className={`w-4 h-4 rounded-full border ${day.hasEntry ? "bg-[var(--color-accent-success)] border-[var(--color-accent-success)] shadow-[0_0_12px_rgba(52,211,153,.2)]" : day.isToday ? "border-[#7c83ff] bg-[rgba(99,102,241,.24)]" : "border-[var(--color-border-default)] bg-[var(--color-surface-input)]"}`} />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[var(--color-text-muted)]">🔥 Racha de diario: {getStreak()} días</p>
            </article>

            <article className="fryd-panel fryd-panel-interactive p-5 min-h-48">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#2dd4bf]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4.5A2.5 2.5 0 017.5 2H20v17H7.5A2.5 2.5 0 005 21.5v-17z"/><path d="M5 4.5v17"/></svg>
                  </span>
                  <h3 className="font-semibold">Diario</h3>
                </div>
                <button onClick={() => navigate("/diary")} className="fryd-link inline-flex items-center gap-1">Ver entradas <Arrow /></button>
              </div>
              <p className="mt-5 text-3xl font-bold">{entries.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{entries.length === 1 ? "entrada" : "entradas"}</p>
              {latestEntry ? (
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[var(--color-text-muted)]">Última entrada</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)] truncate">{latestEntry.title || "Reflexión personal"}</p>
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{formatEntryTime(latestEntry.created_at)}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-white/[0.045] border border-[var(--color-border-subtle)] flex items-center justify-center text-xl flex-shrink-0">{moodEmoji[latestEntry.mood || "neutral"] || "😐"}</div>
                </div>
              ) : (
                <button onClick={() => navigate("/diary", { state: { openCreate: true } })} className="mt-6 fryd-link inline-flex items-center gap-2">Escribir primera entrada <Arrow /></button>
              )}
            </article>
          </section>

          <section className="fryd-panel relative overflow-hidden px-6 py-5 flex items-center gap-4">
            <div className="absolute inset-0 brand-gradient-soft opacity-40 pointer-events-none" />
            <div className="relative brand-gradient w-11 h-11 rounded-full flex items-center justify-center text-2xl font-serif text-white flex-shrink-0">“</div>
            <p className="relative text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl">“La productividad no es hacer más, es enfocar tu energía en lo que realmente importa.”</p>
            <div className="relative ml-auto hidden sm:block text-3xl">🚀</div>
          </section>
        </div>

        <aside className="space-y-9">
          <section className="fryd-panel p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Racha actual</h2>
                <p className="mt-3 text-3xl font-bold">🔥 {getStreak()} <span className="text-xl">días</span></p>
              </div>
              <span className="text-[var(--color-text-muted)]">•••</span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Sigue así; cada registro construye contexto para tu progreso.</p>
            <div className="mt-5 flex justify-between">
              {weekDays.map((day, index) => (
                <div key={`streak-${index}`} className="flex flex-col items-center gap-2.5">
                  <span className={`text-[10px] ${day.isToday ? "text-white font-bold" : "text-[var(--color-text-muted)]"}`}>{day.label}</span>
                  <span className={`w-6 h-6 rounded-full border ${day.hasEntry ? "bg-[var(--color-accent-success)] border-[#54e2b3] shadow-[0_0_14px_rgba(52,211,153,.22)]" : day.isToday ? "bg-[rgba(99,102,241,.45)] border-[#818cf8]" : "bg-[var(--color-surface-input)] border-[var(--color-border-default)]"}`} />
                </div>
              ))}
            </div>
          </section>

          <section className="fryd-panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Próximo en tu agenda</h2>
              <span className="text-[#9da5ff]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>
              </span>
            </div>
            {upcomingTask ? (
              <button onClick={() => navigate("/task")} className="mt-5 w-full rounded-2xl border border-[var(--color-border-subtle)] bg-white/[0.025] p-4 flex items-center gap-4 text-left hover:bg-white/[0.04] transition-colors">
                <div className="w-14 flex-shrink-0 border-r border-[var(--color-border-subtle)] pr-3">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{new Date(upcomingTask.due_date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{new Date(upcomingTask.due_date).toDateString() === new Date().toDateString() ? "Hoy" : new Date(upcomingTask.due_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{upcomingTask.title}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Tarea FRYD</p>
                </div>
              </button>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border-default)] p-5 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">No tienes vencimientos próximos.</p>
              </div>
            )}
            <button onClick={() => navigate("/task")} className="mt-5 fryd-link inline-flex items-center gap-2">Ver tareas <Arrow /></button>
          </section>

          <section className="fryd-panel relative overflow-hidden p-6 min-h-80">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,.2),transparent_48%),radial-gradient(circle_at_90%_90%,rgba(20,184,166,.14),transparent_45%)] pointer-events-none" />
            <div className="relative flex items-center gap-2.5">
              <span className="brand-gradient-text text-xl">✦</span>
              <h2 className="text-base font-semibold">Insight de FRYD</h2>
            </div>
            <p className="relative mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">{insight}</p>

            <div className="relative mt-8 h-24" aria-hidden="true">
              <svg viewBox="0 0 280 90" className="w-full h-full" fill="none">
                <defs>
                  <linearGradient id="insightLine" x1="0" y1="0" x2="280" y2="90">
                    <stop stopColor="#7C3AED" />
                    <stop offset="0.52" stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
                <path d="M2 72 C38 24, 65 42, 94 66 S145 37, 174 28 S221 55, 278 8" stroke="url(#insightLine)" strokeWidth="2.2" strokeLinecap="round" />
                {[{x:48,y:35,c:'#7C3AED'},{x:103,y:65,c:'#3B82F6'},{x:174,y:28,c:'#38BDF8'},{x:226,y:45,c:'#14B8A6'},{x:278,y:8,c:'#2DD4BF'}].map((dot) => <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r="4.5" fill={dot.c} />)}
              </svg>
            </div>
            <button onClick={() => navigate("/analytics")} className="relative mt-5 fryd-link inline-flex items-center gap-2">Ver más analíticas <Arrow /></button>
          </section>
        </aside>
      </div>
    </div>
  );
}
