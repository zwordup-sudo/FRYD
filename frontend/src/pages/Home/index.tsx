import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks, getHabits, getDiaryEntries } from "../../services/api";

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
  created_at: string;
};

export default function HomePage() {
  const navigate = useNavigate();
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

  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const activeHabits = habits.filter((h) => h.status === "active").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;

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

  const taskProgress = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  // Calculate a real daily consecutive streak
  const getStreak = () => {
    if (entries.length === 0) return 0;
    
    // Extract unique dates as YYYY-MM-DD
    const dates = Array.from(new Set(
      entries.map(e => e.created_at.split('T')[0])
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (dates.length === 0) return 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = 0;
    let expectedDate = new Date();
    
    if (dates.includes(todayStr)) {
      expectedDate = new Date();
    } else if (dates.includes(yesterdayStr)) {
      expectedDate = yesterday;
    } else {
      return 0;
    }

    while (true) {
      const dateStr = expectedDate.toISOString().split('T')[0];
      if (dates.includes(dateStr)) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    return currentStreak;
  };

  const streakDays = getStreak();

  // Get current week days (Monday to Sunday) mapping to entry dates
  const getCurrentWeekDays = () => {
    const current = new Date();
    const dayOfWeek = current.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const entryDates = new Set(entries.map(e => e.created_at.split('T')[0]));
    const labels = ["L", "M", "M", "J", "V", "S", "D"];
    const todayStr = new Date().toISOString().split('T')[0];

    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      return {
        label: labels[i],
        hasEntry: entryDates.has(dateStr),
        isToday: dateStr === todayStr,
      };
    });
  };

  const weekDays = getCurrentWeekDays();
  
  // Overall completion rate for the motivation ring
  const overallProgress = tasks.length > 0 || habits.length > 0
    ? Math.round(((completedTasks + activeHabits) / ((tasks.length || 1) + (habits.length || 1))) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
      {/* LEFT COLUMN: Main Dashboard Content (2/3 width on desktop) */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        {/* Header greeting */}
        <div className="mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-1">
            {greeting()} 👋
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm capitalize">
            {today}
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {errorMessage}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Pending tasks */}
          <button
            onClick={() => navigate("/task")}
            className="card text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{pendingTasks}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Pendientes</p>
          </button>

          {/* In progress */}
          <button
            onClick={() => navigate("/task")}
            className="card text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl gradient-amber flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{inProgressTasks}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">En progreso</p>
          </button>

          {/* Active habits */}
          <button
            onClick={() => navigate("/habit")}
            className="card text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{activeHabits}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Hábitos activos</p>
          </button>

          {/* Diary entries */}
          <button
            onClick={() => navigate("/diary")}
            className="card text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
                  <path d="M7 8h10M7 12h7" />
                </svg>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{entries.length}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Entradas diario</p>
          </button>
        </div>

        {/* Task progress */}
        <div className="card-static">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Progreso de tareas</h2>
            <span className="badge badge-green">{taskProgress}%</span>
          </div>

          <div className="w-full h-2.5 bg-[var(--color-surface-input)] rounded-full overflow-hidden mb-4">
            <div
              className="h-full gradient-green rounded-full transition-all duration-700 ease-out"
              style={{ width: `${taskProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-[var(--color-surface-input)]">
              <p className="text-lg font-bold text-[var(--color-accent-primary)]">{completedTasks}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">Completadas</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[var(--color-surface-input)]">
              <p className="text-lg font-bold text-[var(--color-accent-warning)]">{inProgressTasks}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">En progreso</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[var(--color-surface-input)]">
              <p className="text-lg font-bold text-[var(--color-text-secondary)]">{pendingTasks}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">Pendientes</p>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card-static">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Resumen de Actividad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="status-dot status-dot-active" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Productividad</p>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {completedTasks > 0
                  ? `Has completado ${completedTasks} tarea${completedTasks > 1 ? "s" : ""}. ${pendingTasks > 0 ? `Tienes ${pendingTasks} pendiente${pendingTasks > 1 ? "s" : ""}.` : "¡Todo al día!"}`
                  : "Comienza tu día agregando una tarea."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="status-dot status-dot-active" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Estado personal</p>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {entries.length > 0
                  ? `FRYD tiene ${entries.length} entrada${entries.length > 1 ? "s" : ""} de diario y ${activeHabits} hábito${activeHabits !== 1 ? "s" : ""} activo${activeHabits !== 1 ? "s" : ""}s.`
                  : "Registra tu primer día en el diario para comenzar."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Sidebar - Streaks, Progress Gauge & Quick Actions (1/3 width on desktop) */}
      <div className="flex flex-col gap-6">
        {/* Streak & Motivation Panel */}
        <div className="card-static bg-gradient-to-br from-[var(--color-surface-card)] to-[var(--color-surface-input)] relative overflow-hidden group">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-accent-warning)] opacity-10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-accent-warning)]">FRYD Racha Activa</span>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mt-1 flex items-center gap-2">
                🔥 {streakDays} {streakDays === 1 ? "Día" : "Días"}
              </h2>
            </div>
          </div>
          
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            ¡Estás logrando tus objetivos! Mantén la racha registrando tu diario y completando tus tareas diarias.
          </p>

          {/* 7-day mini calendar indicator */}
          <div className="flex items-center justify-between gap-1 mt-4 p-2 bg-[var(--color-surface-input)] rounded-xl border border-[var(--color-border-subtle)]">
            {weekDays.map((day, idx) => {
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className={`text-[10px] font-semibold ${day.isToday ? "text-[var(--color-accent-primary)] font-bold" : "text-[var(--color-text-muted)]"}`}>{day.label}</span>
                  <div 
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                      day.hasEntry 
                        ? "gradient-amber text-var(--color-text-inverse) font-bold shadow-md shadow-[rgba(251,191,36,0.2)]" 
                        : "bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                    } ${day.isToday && !day.hasEntry ? "border border-[var(--color-accent-primary)]/40" : ""}`}
                  >
                    {day.hasEntry ? "✓" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="card-static flex flex-col items-center text-center p-6">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 w-full text-left">Meta del Día</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Track */}
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-[var(--color-surface-input)] fill-transparent"
                strokeWidth="10"
              />
              {/* Foreground Progress */}
              <circle
                cx="72"
                cy="72"
                r="62"
                className="stroke-[var(--color-accent-primary)] fill-transparent transition-all duration-700 ease-out"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 62}
                strokeDashoffset={2 * Math.PI * 62 * (1 - (overallProgress / 100))}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-[var(--color-text-primary)]">{overallProgress}%</span>
              <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">Completado</span>
            </div>
          </div>
          
          <p className="text-xs text-[var(--color-text-secondary)] mt-4">
            {overallProgress >= 80 
              ? "¡Impresionante! Has alcanzado la mayor parte de tus metas de hoy." 
              : overallProgress >= 50 
              ? "¡Vas por buen camino! Continúa un poco más." 
              : "Consigue tus primeros checks del día para activar el progreso."}
          </p>
        </div>

        {/* Quick actions inside the Sidebar */}
        <div className="card-static">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => navigate("/task")}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-input)] hover:bg-[var(--color-surface-card-hover)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-accent)] transition-all duration-200 text-left group"
            >
              <div className="w-8 h-8 rounded-lg gradient-green flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-inverse)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Nueva tarea</p>
                <p className="text-[9px] text-[var(--color-text-muted)]">Agregar pendiente</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/habit")}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-input)] hover:bg-[var(--color-surface-card-hover)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-accent)] transition-all duration-200 text-left group"
            >
              <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Nuevo hábito</p>
                <p className="text-[9px] text-[var(--color-text-muted)]">Crear rutina</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/diary")}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-input)] hover:bg-[var(--color-surface-card-hover)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-accent)] transition-all duration-200 text-left group"
            >
              <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Nueva entrada</p>
                <p className="text-[9px] text-[var(--color-text-muted)]">Escribir en diario</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/assistant")}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-input)] hover:bg-[var(--color-surface-card-hover)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-accent)] transition-all duration-200 text-left group"
            >
              <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Asistente IA</p>
                <p className="text-[9px] text-[var(--color-text-muted)]">Hablar con IA</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}