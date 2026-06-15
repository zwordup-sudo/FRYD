import { useEffect, useState } from "react";
import { getAnalyticsSummary } from "../../services/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────

type MoodTrendPoint = {
  date: string;
  mood: string;
  energy_level: number;
};

type TaskProductivityPoint = {
  week_label: string;
  completed: number;
  created: number;
};

type HabitConsistencyItem = {
  name: string;
  completion_rate: number;
  total_days: number;
  completed_days: number;
};

type CorrelationPoint = {
  date: string;
  energy: number | null;
  habits_completed: number;
  tasks_completed: number;
};

type AnalyticsData = {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_habits: number;
  active_habits: number;
  total_entries: number;
  avg_energy: number;
  most_common_mood: string;
  current_streak: number;
  mood_trend: MoodTrendPoint[];
  task_productivity: TaskProductivityPoint[];
  habit_consistency: HabitConsistencyItem[];
  daily_correlation: CorrelationPoint[];
};

// ── Mood Config ────────────────────────────────────────────────────

const moodConfig: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: "😊", label: "Feliz", color: "#34d399" },
  sad: { emoji: "😢", label: "Triste", color: "#60a5fa" },
  annoyed: { emoji: "😤", label: "Molesto", color: "#f87171" },
  excited: { emoji: "🤩", label: "Emocionado", color: "#fbbf24" },
  neutral: { emoji: "😐", label: "Neutral", color: "#9ca3af" },
  stressed: { emoji: "😰", label: "Estresado", color: "#c084fc" },
  calm: { emoji: "😌", label: "Calmado", color: "#2dd4bf" },
};

// ── Chart Colors ───────────────────────────────────────────────────

const COLORS = {
  primary: "#34d399",
  secondary: "#a78bfa",
  tertiary: "#f472b6",
  warning: "#fbbf24",
  info: "#60a5fa",
  grid: "rgba(255, 255, 255, 0.04)",
  axis: "rgba(255, 255, 255, 0.25)",
  tooltipBg: "rgba(15, 15, 20, 0.95)",
};

// ── Custom Tooltip ─────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[rgba(15,15,20,0.95)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] text-[rgba(255,255,255,0.4)] font-semibold uppercase tracking-wider mb-1.5">
        {label}
      </p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[rgba(255,255,255,0.6)]">{entry.name}:</span>
          <span className="font-semibold text-white">
            {typeof entry.value === "number" ? entry.value.toFixed(entry.name?.includes("%") ? 1 : 0) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Consistency bar color helper ───────────────────────────────────

const getConsistencyColor = (rate: number) => {
  if (rate >= 80) return "#34d399";
  if (rate >= 60) return "#fbbf24";
  if (rate >= 40) return "#fb923c";
  return "#f87171";
};

// ── Main Component ─────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const result = await getAnalyticsSummary();
      setData(result);
    } catch {
      setError("Error al cargar las analíticas");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-fade-in">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--color-accent-primary-glow)] border-t-[var(--color-accent-primary)] animate-spin" />
        <p className="text-sm text-[var(--color-text-muted)]">Calculando tus analíticas...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-fade-in">
        <div className="alert alert-error">{error || "No se pudieron cargar los datos"}</div>
        <button onClick={loadAnalytics} className="btn-secondary text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  const taskCompletionRate =
    data.total_tasks > 0 ? Math.round((data.completed_tasks / data.total_tasks) * 100) : 0;

  const avgConsistency =
    data.habit_consistency.length > 0
      ? Math.round(
          data.habit_consistency.reduce((sum, h) => sum + h.completion_rate, 0) /
            data.habit_consistency.length
        )
      : 0;

  // Format mood trend dates for display
  const moodTrendFormatted = data.mood_trend.map((p) => ({
    ...p,
    shortDate: new Date(p.date + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    }),
    moodEmoji: moodConfig[p.mood]?.emoji || "😐",
    moodLabel: moodConfig[p.mood]?.label || p.mood,
  }));

  // Format correlation dates
  const correlationFormatted = data.daily_correlation.map((p) => ({
    ...p,
    shortDate: new Date(p.date + "T12:00:00").toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Analíticas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Visualiza tu progreso, descubre patrones y mejora cada día.
          </p>
        </div>
        <button onClick={loadAnalytics} className="btn-secondary self-start sm:self-auto text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* ── Row 1: Summary Stats ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Tasks completed */}
        <div className="card-static animate-slide-in-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {taskCompletionRate}%
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Tareas completadas</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[var(--color-surface-input)] rounded-full overflow-hidden">
            <div
              className="h-full gradient-green rounded-full transition-all duration-700"
              style={{ width: `${taskCompletionRate}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
            {data.completed_tasks} de {data.total_tasks} tareas
          </p>
        </div>

        {/* Active habits */}
        <div className="card-static animate-slide-in-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {avgConsistency}%
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Consistencia hábitos</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[var(--color-surface-input)] rounded-full overflow-hidden">
            <div
              className="h-full gradient-purple rounded-full transition-all duration-700"
              style={{ width: `${avgConsistency}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
            {data.active_habits} hábitos activos
          </p>
        </div>

        {/* Average energy */}
        <div className="card-static animate-slide-in-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-amber flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {data.avg_energy}
                <span className="text-sm text-[var(--color-text-muted)]">/5</span>
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Energía promedio</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[var(--color-surface-input)] rounded-full overflow-hidden">
            <div
              className="h-full gradient-amber rounded-full transition-all duration-700"
              style={{ width: `${(data.avg_energy / 5) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
            Ánimo frecuente: {moodConfig[data.most_common_mood]?.emoji || "😐"}{" "}
            {moodConfig[data.most_common_mood]?.label || data.most_common_mood}
          </p>
        </div>

        {/* Streak */}
        <div className="card-static animate-slide-in-up relative overflow-hidden" style={{ animationDelay: "180ms" }}>
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-[var(--color-accent-warning)] opacity-10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
              <span className="text-lg">🔥</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {data.current_streak}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Racha de diario</p>
            </div>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
            {data.total_entries} entradas totales
          </p>
        </div>
      </div>

      {/* ── Row 2: Main Charts ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Mood & Energy Trend */}
        <div className="card-static animate-slide-in-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Tendencia de Ánimo y Energía
              </h2>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Últimos 30 días</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                <span className="text-[10px] text-[var(--color-text-muted)]">Energía</span>
              </div>
            </div>
          </div>
          <div className="h-[260px]">
            {moodTrendFormatted.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodTrendFormatted}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.grid }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0]?.payload;
                      return (
                        <div className="bg-[rgba(15,15,20,0.95)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
                          <p className="text-[10px] text-[rgba(255,255,255,0.4)] font-semibold uppercase tracking-wider mb-1.5">
                            {label}
                          </p>
                          <div className="flex items-center gap-2 text-xs mb-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                            <span className="text-[rgba(255,255,255,0.6)]">Energía:</span>
                            <span className="font-semibold text-white">{point?.energy_level}/5</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span>{point?.moodEmoji}</span>
                            <span className="text-[rgba(255,255,255,0.6)]">Ánimo:</span>
                            <span className="font-semibold text-white">{point?.moodLabel}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy_level"
                    stroke={COLORS.primary}
                    strokeWidth={2.5}
                    dot={(props: any) => {
                      const moodColor = moodConfig[props.payload?.mood]?.color || "#9ca3af";
                      return (
                        <circle
                          key={props.key}
                          cx={props.cx}
                          cy={props.cy}
                          r={4}
                          fill={moodColor}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={1}
                        />
                      );
                    }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    name="Energía"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-muted)]">
                No hay datos de diario para mostrar
              </div>
            )}
          </div>
          {/* Mini mood legend */}
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
            {Object.entries(moodConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-[9px] text-[var(--color-text-muted)]">{cfg.emoji} {cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Productivity */}
        <div className="card-static animate-slide-in-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Productividad Semanal
              </h2>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Últimas 4 semanas</p>
            </div>
          </div>
          <div className="h-[260px]">
            {data.task_productivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.task_productivity} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis
                    dataKey="week_label"
                    tick={{ fontSize: 9, fill: COLORS.axis }}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.grid }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}
                  />
                  <Bar
                    dataKey="created"
                    name="Creadas"
                    fill={COLORS.info}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completadas"
                    fill={COLORS.primary}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-muted)]">
                No hay tareas para mostrar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Secondary Charts ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Consistency */}
        <div className="card-static animate-slide-in-up" style={{ animationDelay: "360ms" }}>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Consistencia de Hábitos
            </h2>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              % de cumplimiento en los últimos 30 días
            </p>
          </div>
          <div className="h-[260px]">
            {data.habit_consistency.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.habit_consistency}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0]?.payload as HabitConsistencyItem;
                      return (
                        <div className="bg-[rgba(15,15,20,0.95)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
                          <p className="text-xs font-semibold text-white mb-1">{item.name}</p>
                          <p className="text-[10px] text-[rgba(255,255,255,0.6)]">
                            {item.completed_days} de {item.total_days} días ({item.completion_rate}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="completion_rate"
                    name="Consistencia %"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={24}
                  >
                    {data.habit_consistency.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getConsistencyColor(entry.completion_rate)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-muted)]">
                No hay hábitos activos para analizar
              </div>
            )}
          </div>
        </div>

        {/* Daily Correlation */}
        <div className="card-static animate-slide-in-up" style={{ animationDelay: "420ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Correlación Diaria
              </h2>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Energía vs Hábitos vs Tareas (14 días)
              </p>
            </div>
          </div>
          <div className="h-[260px]">
            {correlationFormatted.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={correlationFormatted}>
                  <defs>
                    <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="habitsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.info} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 9, fill: COLORS.axis }}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.grid }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: COLORS.axis }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="energy"
                    name="Energía"
                    stroke={COLORS.warning}
                    strokeWidth={2}
                    fill="url(#energyGradient)"
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="habits_completed"
                    name="Hábitos"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fill="url(#habitsGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tasks_completed"
                    name="Tareas"
                    stroke={COLORS.info}
                    strokeWidth={2}
                    fill="url(#tasksGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[var(--color-text-muted)]">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
