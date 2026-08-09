import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../../components/ui/PageHeader";
import StatTile from "../../components/ui/StatTile";
import { getAnalyticsSummary } from "../../services/api";

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

const moodConfig: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: "😊", label: "Feliz", color: "#34d399" },
  sad: { emoji: "😢", label: "Triste", color: "#60a5fa" },
  annoyed: { emoji: "😤", label: "Molesto", color: "#f87171" },
  excited: { emoji: "🤩", label: "Emocionado", color: "#fbbf24" },
  neutral: { emoji: "😐", label: "Neutral", color: "#94a3b8" },
  stressed: { emoji: "😰", label: "Estresado", color: "#c084fc" },
  calm: { emoji: "😌", label: "Calmado", color: "#14b8a6" },
};

const CHART = {
  violet: "#6366f1",
  blue: "#3b82f6",
  teal: "#14b8a6",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  grid: "rgba(148, 163, 184, 0.09)",
  axis: "#64748b",
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatShortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function getConsistencyTone(rate: number) {
  if (rate >= 80) return { color: CHART.success, label: "Muy sólido" };
  if (rate >= 60) return { color: CHART.teal, label: "Buen ritmo" };
  if (rate >= 40) return { color: CHART.warning, label: "En construcción" };
  return { color: CHART.danger, label: "Necesita atención" };
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="fryd-chart-tooltip">
      {label && <p className="fryd-chart-tooltip-label">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={`${entry.dataKey}-${index}`} className="flex items-center justify-between gap-5 text-xs">
            <span className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke }} />
              {entry.name}
            </span>
            <strong className="font-semibold text-[var(--color-text-primary)]">
              {entry.value ?? "—"}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconRepeat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m17 1 4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="m7 23-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22c4.4 0 8-3.1 8-7.4 0-2.7-1.2-4.7-3.5-6.9.1 2.4-1.5 3.7-2.7 4.2.1-3.4-1.9-7-5.5-9.9.1 4.7-4.3 6.3-4.3 11.5C4 18.5 7.6 22 12 22Z" />
    </svg>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getAnalyticsSummary();
      setData(result);
    } catch {
      setError("Error al cargar las analíticas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const analytics = useMemo(() => {
    if (!data) return null;

    const taskCompletionRate = data.total_tasks
      ? Math.round((data.completed_tasks / data.total_tasks) * 100)
      : 0;
    const avgConsistency = data.habit_consistency.length
      ? Math.round(
          data.habit_consistency.reduce((sum, habit) => sum + habit.completion_rate, 0) /
            data.habit_consistency.length,
        )
      : 0;
    const energyRate = clamp((data.avg_energy / 5) * 100);
    const momentumScore = Math.round(
      clamp(taskCompletionRate * 0.45 + avgConsistency * 0.35 + energyRate * 0.2),
    );

    const totalCreated = data.task_productivity.reduce((sum, week) => sum + week.created, 0);
    const totalCompleted = data.task_productivity.reduce((sum, week) => sum + week.completed, 0);
    const weeklyBalance = totalCompleted - totalCreated;

    const sortedHabits = [...data.habit_consistency].sort(
      (a, b) => b.completion_rate - a.completion_rate,
    );
    const strongestHabit = sortedHabits[0] ?? null;

    const recentEnergy = data.mood_trend.slice(-7).map((point) => point.energy_level);
    const previousEnergy = data.mood_trend.slice(-14, -7).map((point) => point.energy_level);
    const avg = (values: number[]) =>
      values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const energyDelta = avg(recentEnergy) - avg(previousEnergy);

    let insightTitle = "Estás construyendo una base estable";
    let insightBody =
      "Tus datos ya muestran suficiente actividad para empezar a reconocer patrones entre tareas, hábitos y energía.";

    if (momentumScore >= 80) {
      insightTitle = "Tu ritmo está muy fuerte";
      insightBody =
        "Tareas, hábitos y energía están alineados. Conviene proteger este ritmo antes de aumentar la carga de trabajo.";
    } else if (taskCompletionRate >= 70 && avgConsistency < 55) {
      insightTitle = "Cumples tareas, pero tus hábitos pueden darte más estabilidad";
      insightBody =
        "Tu ejecución es buena. Consolidar uno o dos hábitos clave puede hacer que ese rendimiento sea más sostenible.";
    } else if (avgConsistency >= 70 && taskCompletionRate < 55) {
      insightTitle = "Tus hábitos son sólidos; ahora toca convertirlos en avance";
      insightBody =
        "Tienes una buena base de constancia. Prueba reducir tareas abiertas y priorizar una meta principal por día.";
    } else if (data.avg_energy < 2.8) {
      insightTitle = "La energía podría estar limitando tu avance";
      insightBody =
        "Tu promedio reciente es bajo. Considera días con menos carga y observa qué hábitos coinciden con mejores niveles de energía.";
    }

    return {
      taskCompletionRate,
      avgConsistency,
      momentumScore,
      totalCreated,
      totalCompleted,
      weeklyBalance,
      strongestHabit,
      energyDelta,
      insightTitle,
      insightBody,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="fryd-brand-spinner" />
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Leyendo tus patrones</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">FRYD está preparando tu panorama.</p>
        </div>
      </div>
    );
  }

  if (error || !data || !analytics) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="alert alert-error">{error || "No se pudieron cargar los datos"}</div>
        <button onClick={loadAnalytics} className="btn-secondary text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  const moodTrend = data.mood_trend.map((point) => ({
    ...point,
    shortDate: formatShortDate(point.date),
    moodEmoji: moodConfig[point.mood]?.emoji || "😐",
    moodLabel: moodConfig[point.mood]?.label || point.mood,
  }));

  const dailyRhythm = data.daily_correlation.map((point) => ({
    ...point,
    shortDate: formatShortDate(point.date),
  }));

  const commonMood = moodConfig[data.most_common_mood] || moodConfig.neutral;
  const momentumCircumference = 2 * Math.PI * 44;
  const momentumOffset = momentumCircumference * (1 - analytics.momentumScore / 100);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="PATRONES Y PROGRESO"
        title="Analíticas"
        description="Convierte tu actividad diaria en señales claras para decidir qué mantener, qué ajustar y dónde poner tu energía."
        action={
          <button onClick={loadAnalytics} className="btn-secondary text-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 11a8.1 8.1 0 1 1-2.4-5.7L20 7.7" />
              <path d="M20 3v5h-5" />
            </svg>
            Actualizar
          </button>
        }
      />

      <section className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4 lg:gap-x-4 lg:gap-y-6">
        <StatTile
          label="Tareas completadas"
          value={`${analytics.taskCompletionRate}%`}
          detail={`${data.completed_tasks} de ${data.total_tasks} tareas`}
          tone="success"
          icon={<IconCheck />}
        />
        <StatTile
          label="Consistencia de hábitos"
          value={`${analytics.avgConsistency}%`}
          detail={`${data.active_habits} hábitos activos`}
          tone="brand"
          icon={<IconRepeat />}
        />
        <StatTile
          label="Energía promedio"
          value={`${data.avg_energy}/5`}
          detail={`${commonMood.emoji} ${commonMood.label} es tu ánimo frecuente`}
          tone="warning"
          icon={<IconBolt />}
        />
        <StatTile
          label="Racha de diario"
          value={`${data.current_streak} días`}
          detail={`${data.total_entries} entradas registradas`}
          tone="muted"
          icon={<IconFlame />}
        />
      </section>

      <section className="mt-9 grid gap-x-5 gap-y-9 xl:grid-cols-[1.45fr_0.9fr]">
        <article className="fryd-analytics-hero">
          <div className="fryd-analytics-hero-accent" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="fryd-momentum-ring" aria-label={`Momentum personal ${analytics.momentumScore} de 100`}>
              <svg viewBox="0 0 108 108" role="img">
                <defs>
                  <linearGradient id="frydMomentumGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={CHART.violet} />
                    <stop offset="55%" stopColor={CHART.blue} />
                    <stop offset="100%" stopColor={CHART.teal} />
                  </linearGradient>
                </defs>
                <circle cx="54" cy="54" r="44" className="fryd-momentum-track" />
                <circle
                  cx="54"
                  cy="54"
                  r="44"
                  className="fryd-momentum-progress"
                  stroke="url(#frydMomentumGradient)"
                  strokeDasharray={momentumCircumference}
                  strokeDashoffset={momentumOffset}
                />
              </svg>
              <div className="fryd-momentum-value">
                <strong>{analytics.momentumScore}</strong>
                <span>/100</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="fryd-section-label">MOMENTUM PERSONAL</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
                Tu sistema está {analytics.momentumScore >= 70 ? "tomando buen ritmo" : "ganando estabilidad"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
                Este indicador combina cumplimiento de tareas, consistencia de hábitos y energía registrada. No busca medir cuánto haces, sino qué tan sostenible se ve tu ritmo.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="fryd-analytics-mini-metric">
                  <span>Balance 4 semanas</span>
                  <strong className={analytics.weeklyBalance >= 0 ? "text-emerald-300" : "text-amber-300"}>
                    {analytics.weeklyBalance >= 0 ? "+" : ""}{analytics.weeklyBalance}
                  </strong>
                  <small>completadas vs creadas</small>
                </div>
                <div className="fryd-analytics-mini-metric">
                  <span>Energía reciente</span>
                  <strong className={analytics.energyDelta >= 0 ? "text-cyan-300" : "text-amber-300"}>
                    {analytics.energyDelta > 0 ? "+" : ""}{analytics.energyDelta.toFixed(1)}
                  </strong>
                  <small>vs semana anterior</small>
                </div>
                <div className="fryd-analytics-mini-metric">
                  <span>Hábito más sólido</span>
                  <strong className="truncate text-indigo-200">
                    {analytics.strongestHabit?.name || "—"}
                  </strong>
                  <small>{analytics.strongestHabit ? `${Math.round(analytics.strongestHabit.completion_rate)}% consistencia` : "Sin datos suficientes"}</small>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside className="fryd-analytics-insight">
          <div className="fryd-insight-mark" aria-hidden="true">✦</div>
          <div>
            <p className="fryd-section-label">LECTURA FRYD</p>
            <h2 className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">
              {analytics.insightTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {analytics.insightBody}
            </p>
          </div>
          <div className="mt-auto border-t border-[var(--color-border-subtle)] pt-4">
            <p className="text-[11px] leading-5 text-[var(--color-text-muted)]">
              Esta lectura se calcula con tus métricas actuales; no sustituye tu propio contexto ni pretende evaluar tu rendimiento personal.
            </p>
          </div>
        </aside>
      </section>

      <section className="mt-9 grid gap-x-5 gap-y-9 xl:grid-cols-2">
        <article className="fryd-analytics-panel">
          <div className="fryd-analytics-panel-header">
            <div>
              <p className="fryd-section-label">EJECUCIÓN</p>
              <h2>Productividad semanal</h2>
              <p>Compara el volumen de tareas creadas y completadas durante las últimas semanas.</p>
            </div>
            <div className="fryd-chart-legend">
              <span><i style={{ backgroundColor: CHART.blue }} />Creadas</span>
              <span><i style={{ backgroundColor: CHART.teal }} />Completadas</span>
            </div>
          </div>

          <div className="h-[285px] w-full">
            {data.task_productivity.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.task_productivity} barGap={5} margin={{ top: 10, right: 2, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="week_label" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.035)" }} content={<ChartTooltip />} />
                  <Bar dataKey="created" name="Creadas" fill={CHART.blue} radius={[7, 7, 2, 2]} maxBarSize={34} />
                  <Bar dataKey="completed" name="Completadas" fill={CHART.teal} radius={[7, 7, 2, 2]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="fryd-analytics-empty">Aún no hay actividad semanal suficiente.</div>
            )}
          </div>
        </article>

        <article className="fryd-analytics-panel">
          <div className="fryd-analytics-panel-header">
            <div>
              <p className="fryd-section-label">BIENESTAR</p>
              <h2>Energía y ánimo</h2>
              <p>Observa cómo ha cambiado tu energía y qué estados de ánimo aparecen alrededor de esos cambios.</p>
            </div>
            <div className="fryd-chart-legend">
              <span><i style={{ backgroundColor: CHART.violet }} />Energía</span>
            </div>
          </div>

          <div className="h-[285px] w-full">
            {moodTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="shortDate" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0]?.payload;
                      return (
                        <div className="fryd-chart-tooltip">
                          <p className="fryd-chart-tooltip-label">{label}</p>
                          <div className="flex items-center justify-between gap-5 text-xs">
                            <span className="text-[var(--color-text-secondary)]">Energía</span>
                            <strong className="text-[var(--color-text-primary)]">{point?.energy_level}/5</strong>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-5 text-xs">
                            <span className="text-[var(--color-text-secondary)]">Ánimo</span>
                            <strong className="text-[var(--color-text-primary)]">{point?.moodEmoji} {point?.moodLabel}</strong>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy_level"
                    name="Energía"
                    stroke={CHART.violet}
                    strokeWidth={2.5}
                    dot={(props: any) => (
                      <circle
                        key={`${props.payload?.date}-${props.index}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={3.5}
                        fill={moodConfig[props.payload?.mood]?.color || CHART.violet}
                        stroke="var(--color-surface-card)"
                        strokeWidth={2}
                      />
                    )}
                    activeDot={{ r: 5.5, strokeWidth: 2, stroke: "#ffffff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="fryd-analytics-empty">Registra entradas en tu diario para descubrir esta tendencia.</div>
            )}
          </div>

          {moodTrend.length > 0 && (
            <div className="fryd-mood-legend">
              {Object.values(moodConfig).map((mood) => (
                <span key={mood.label}><i style={{ backgroundColor: mood.color }} />{mood.emoji} {mood.label}</span>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
        <article className="fryd-analytics-panel">
          <div className="fryd-analytics-panel-header">
            <div>
              <p className="fryd-section-label">CONSTANCIA</p>
              <h2>Hábitos que sostienen tu ritmo</h2>
              <p>Ordenados por cumplimiento durante los últimos 30 días.</p>
            </div>
          </div>

          {data.habit_consistency.length ? (
            <div className="space-y-4 pt-1">
              {[...data.habit_consistency]
                .sort((a, b) => b.completion_rate - a.completion_rate)
                .slice(0, 7)
                .map((habit, index) => {
                  const tone = getConsistencyTone(habit.completion_rate);
                  return (
                    <div key={habit.name} className="fryd-habit-analytics-row">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="fryd-habit-rank">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <strong className="truncate text-sm font-medium text-[var(--color-text-primary)]">{habit.name}</strong>
                            <span className="text-xs font-semibold" style={{ color: tone.color }}>{Math.round(habit.completion_rate)}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-input)]">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clamp(habit.completion_rate)}%`, backgroundColor: tone.color }} />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                            <span>{habit.completed_days} de {habit.total_days} días</span>
                            <span>{tone.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="fryd-analytics-empty min-h-[230px]">Activa hábitos para comparar su consistencia.</div>
          )}
        </article>

        <article className="fryd-analytics-panel">
          <div className="fryd-analytics-panel-header">
            <div>
              <p className="fryd-section-label">RITMO DIARIO</p>
              <h2>Cómo se mueven juntas tus señales</h2>
              <p>Energía, hábitos completados y tareas completadas durante los últimos 14 días.</p>
            </div>
            <div className="fryd-chart-legend">
              <span><i style={{ backgroundColor: CHART.warning }} />Energía</span>
              <span><i style={{ backgroundColor: CHART.teal }} />Hábitos</span>
              <span><i style={{ backgroundColor: CHART.blue }} />Tareas</span>
            </div>
          </div>

          <div className="h-[315px] w-full">
            {dailyRhythm.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRhythm} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="energyArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.warning} stopOpacity={0.20} />
                      <stop offset="100%" stopColor={CHART.warning} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="habitArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.teal} stopOpacity={0.17} />
                      <stop offset="100%" stopColor={CHART.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="taskArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={CHART.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="shortDate" tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="energy" name="Energía" stroke={CHART.warning} strokeWidth={2} fill="url(#energyArea)" connectNulls />
                  <Area type="monotone" dataKey="habits_completed" name="Hábitos" stroke={CHART.teal} strokeWidth={2} fill="url(#habitArea)" />
                  <Area type="monotone" dataKey="tasks_completed" name="Tareas" stroke={CHART.blue} strokeWidth={2} fill="url(#taskArea)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="fryd-analytics-empty">Aún no hay suficiente actividad diaria para comparar señales.</div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
