import { useEffect, useMemo, useState } from "react";
import { adminListUsers, adminToggleAdmin } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import StatTile from "../../components/ui/StatTile";
import SegmentedTabs from "../../components/ui/SegmentedTabs";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  profile_focus: string;
  is_admin: boolean;
  whatsapp_active: boolean;
  tasks_count: number;
  habits_count: number;
  diary_count: number;
}

type FilterKey = "all" | "admins" | "users" | "whatsapp";

const icons = {
  users: <span aria-hidden className="text-base">👥</span>,
  shield: <span aria-hidden className="text-base">🛡️</span>,
  activity: <span aria-hidden className="text-base">↗</span>,
  whatsapp: <span aria-hidden className="text-base">◉</span>,
};

const normalizeFocus = (focus?: string) => {
  const value = (focus || "personal").toLowerCase();
  if (value.includes("work") || value.includes("trabajo")) return "trabajo";
  if (value.includes("emplead")) return "empleado";
  if (value.includes("estud")) return "estudiante";
  return "personal";
};

const focusLabels: Record<string, string> = {
  personal: "Personal",
  trabajo: "Trabajo",
  estudiante: "Estudiante",
  empleado: "Empleado",
};

const focusBadgeClass: Record<string, string> = {
  personal: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  trabajo: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  estudiante: "bg-teal-500/10 text-teal-300 border-teal-500/20",
  empleado: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function initialFromName(name: string) {
  const clean = name?.trim();
  return clean ? clean.charAt(0).toUpperCase() : "U";
}

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminListUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Error al cargar la información de administración.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setShowAllAccounts(false);
  }, [searchTerm, filter]);

  const handleToggleAdmin = async (userId: number, username: string) => {
    if (userId === currentUser?.id) {
      alert("No puedes quitarte el rol de administrador a ti mismo.");
      return;
    }
    if (!window.confirm(`¿Seguro que deseas modificar el rol de administrador de ${username}?`)) return;

    try {
      setBusyUserId(userId);
      await adminToggleAdmin(userId);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Error al modificar permisos.");
    } finally {
      setBusyUserId(null);
    }
  };

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.is_admin).length;
  const totalTasks = users.reduce((acc, curr) => acc + curr.tasks_count, 0);
  const totalHabits = users.reduce((acc, curr) => acc + curr.habits_count, 0);
  const totalDiaries = users.reduce((acc, curr) => acc + curr.diary_count, 0);
  const totalActivity = totalTasks + totalHabits + totalDiaries;
  const totalWhatsApp = users.filter((u) => u.whatsapp_active).length;
  const activeTaskUsers = users.filter((u) => u.tasks_count > 0).length;
  const activeHabitUsers = users.filter((u) => u.habits_count > 0).length;
  const activeDiaryUsers = users.filter((u) => u.diary_count > 0).length;
  const engagedUsers = users.filter((u) => u.tasks_count + u.habits_count + u.diary_count > 0).length;

  const focusSummary = useMemo(() => {
    const base = { personal: 0, trabajo: 0, estudiante: 0, empleado: 0 };
    users.forEach((user) => {
      const key = normalizeFocus(user.profile_focus) as keyof typeof base;
      base[key] += 1;
    });
    return base;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const matchesTerm = !term || u.username.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
      if (!matchesTerm) return false;
      if (filter === "admins") return u.is_admin;
      if (filter === "users") return !u.is_admin;
      if (filter === "whatsapp") return u.whatsapp_active;
      return true;
    });
  }, [users, searchTerm, filter]);

  const visibleUsers = useMemo(() => {
    if (showAllAccounts || filteredUsers.length <= 8) return filteredUsers;
    return filteredUsers.slice(0, 8);
  }, [filteredUsers, showAllAccounts]);

  const tabs: Array<{ key: FilterKey; label: string; count?: number }> = [
    { key: "all" as const, label: "Todos", count: users.length },
    { key: "admins" as const, label: "Admins", count: totalAdmins },
    { key: "users" as const, label: "Usuarios", count: users.length - totalAdmins },
    { key: "whatsapp" as const, label: "WhatsApp", count: totalWhatsApp },
  ];

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-[500px] flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent-primary)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-muted)]">Cargando FRYD Control Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-4 sm:p-6">
      <PageHeader
        eyebrow="Administración"
        title="FRYD Control Center"
        description="Supervisa el estado general de FRYD y gestiona permisos sin perder de vista lo importante."
        action={
          <button type="button" className="btn-secondary" onClick={loadData} disabled={loading}>
            <span className="mr-2">↻</span>
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        }
      />

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* Four global signals only. Module-level detail lives in the adoption panel below. */}
      <section className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Usuarios"
          value={totalUsers}
          detail={`${engagedUsers} con actividad registrada`}
          icon={icons.users}
          tone="brand"
        />
        <StatTile
          label="Administradores"
          value={totalAdmins}
          detail={`${percentage(totalAdmins, totalUsers)}% de las cuentas`}
          icon={icons.shield}
          tone="muted"
        />
        <StatTile
          label="Actividad registrada"
          value={totalActivity}
          detail="Tareas + hábitos + diario"
          icon={icons.activity}
          tone="brand"
        />
        <StatTile
          label="WhatsApp activo"
          value={totalWhatsApp}
          detail={`${percentage(totalWhatsApp, totalUsers)}% de adopción`}
          icon={icons.whatsapp}
          tone="success"
        />
      </section>

      {/* Secondary information is grouped into only two panels to reduce visual density. */}
      <section className="grid grid-cols-1 gap-x-6 gap-y-8 xl:grid-cols-[1.25fr_.75fr]">
        <article className="fryd-surface-panel p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="fryd-section-label mb-2">Panorama del sistema</p>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Uso por módulo</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Porcentaje de cuentas que ya usan cada área principal.</p>
            </div>
            <span className="rounded-full border border-[var(--color-border-subtle)] bg-white/[0.03] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
              {engagedUsers}/{totalUsers} activas
            </span>
          </div>

          <div className="space-y-5">
            {[
              { label: "Tareas", users: activeTaskUsers, records: totalTasks, gradient: "from-violet-500 to-blue-500" },
              { label: "Hábitos", users: activeHabitUsers, records: totalHabits, gradient: "from-blue-500 to-teal-500" },
              { label: "Diario", users: activeDiaryUsers, records: totalDiaries, gradient: "from-fuchsia-500 to-violet-500" },
            ].map((item) => {
              const pct = percentage(item.users, totalUsers);
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.records} registros</p>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">{item.users} usuarios · {pct}%</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="fryd-surface-panel p-5 sm:p-6">
          <p className="fryd-section-label mb-2">Enfoques</p>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Tipos de cuenta</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Cómo se distribuye el contexto principal de los usuarios.</p>

          <div className="mt-6 space-y-5">
            {Object.entries(focusSummary).map(([key, value]) => {
              const pct = percentage(value, totalUsers);
              return (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-primary)]">{focusLabels[key]}</span>
                    <span className="text-[var(--color-text-secondary)]">{value} · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div className="h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="fryd-surface-panel overflow-hidden p-5 sm:p-6">
        <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="fryd-section-label mb-2">Gestión de cuentas</p>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Usuarios y privilegios</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">La vista inicial muestra hasta ocho cuentas para mantener el panel ligero.</p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-center lg:justify-end">
            <SegmentedTabs<FilterKey> tabs={tabs} value={filter} onChange={setFilter} />
            <label className="fryd-search-field lg:max-w-xs">
              <span className="text-[var(--color-text-muted)]">⌕</span>
              <input
                type="text"
                placeholder="Buscar usuario o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2.5 text-xs text-[var(--color-text-secondary)]">
          <span className="rounded-full border border-[var(--color-border-subtle)] bg-white/[0.02] px-3 py-1.5">
            {filteredUsers.length} cuenta{filteredUsers.length === 1 ? "" : "s"} en este filtro
          </span>
          <span className="rounded-full border border-[var(--color-border-subtle)] bg-white/[0.02] px-3 py-1.5">
            {totalAdmins} admin{totalAdmins === 1 ? "" : "s"}
          </span>
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-[var(--color-border-default)] lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.015] text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                <th className="px-4 py-3 font-semibold">Cuenta</th>
                <th className="px-4 py-3 font-semibold">Enfoque</th>
                <th className="px-4 py-3 font-semibold">Actividad</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--color-text-muted)]">No se encontraron cuentas con ese filtro.</td>
                </tr>
              ) : (
                visibleUsers.map((u) => {
                  const userActivity = u.tasks_count + u.habits_count + u.diary_count;
                  const focusKey = normalizeFocus(u.profile_focus);
                  return (
                    <tr key={u.id} className="border-b border-white/[0.04] transition-colors last:border-b-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--brand-gradient-soft)] font-semibold text-white">
                            {initialFromName(u.username)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{u.username}</p>
                              {u.id === currentUser?.id && <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-300">Tú</span>}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="truncate text-xs text-[var(--color-text-muted)]">{u.email}</p>
                              {u.whatsapp_active && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">WhatsApp</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${focusBadgeClass[focusKey]}`}>{focusLabels[focusKey]}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-violet-500/15 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-200">T {u.tasks_count}</span>
                          <span className="rounded-full border border-sky-500/15 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-200">H {u.habits_count}</span>
                          <span className="rounded-full border border-teal-500/15 bg-teal-500/10 px-2 py-1 text-[11px] text-teal-200">D {u.diary_count}</span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">{userActivity} total</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${u.is_admin ? "border-violet-500/20 bg-violet-500/10 text-violet-300" : "border-white/8 bg-white/[0.03] text-[var(--color-text-secondary)]"}`}>
                          {u.is_admin ? "Administrador" : "Usuario"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.username)}
                          disabled={u.id === currentUser?.id || busyUserId === u.id}
                          className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                            u.id === currentUser?.id
                              ? "cursor-not-allowed border-transparent text-[var(--color-text-muted)] opacity-45"
                              : u.is_admin
                              ? "border-red-500/20 bg-red-500/5 text-red-300 hover:bg-red-500/10"
                              : "border-[var(--color-border-accent)] bg-[var(--brand-gradient-soft)] text-[var(--color-text-primary)] hover:brightness-110"
                          }`}
                        >
                          {busyUserId === u.id ? "Guardando..." : u.is_admin ? "Quitar admin" : "Hacer admin"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-y-5 lg:hidden">
          {visibleUsers.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-white/[0.02] p-5 text-center text-sm text-[var(--color-text-muted)]">No se encontraron cuentas con ese filtro.</div>
          ) : (
            visibleUsers.map((u) => {
              const userActivity = u.tasks_count + u.habits_count + u.diary_count;
              const focusKey = normalizeFocus(u.profile_focus);
              return (
                <article key={u.id} className="rounded-2xl border border-[var(--color-border-default)] bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--brand-gradient-soft)] font-semibold text-white">{initialFromName(u.username)}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{u.username}</p>
                          {u.id === currentUser?.id && <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-300">Tú</span>}
                        </div>
                        <p className="truncate text-xs text-[var(--color-text-muted)]">{u.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${u.is_admin ? "border-violet-500/20 bg-violet-500/10 text-violet-300" : "border-white/8 bg-white/[0.03] text-[var(--color-text-secondary)]"}`}>{u.is_admin ? "Admin" : "Usuario"}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${focusBadgeClass[focusKey]}`}>{focusLabels[focusKey]}</span>
                    {u.whatsapp_active && <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">WhatsApp</span>}
                  </div>

                  <p className="mt-4 text-xs text-[var(--color-text-muted)]">Actividad: <strong className="text-[var(--color-text-secondary)]">{userActivity}</strong> registros · T {u.tasks_count} · H {u.habits_count} · D {u.diary_count}</p>

                  <button
                    onClick={() => handleToggleAdmin(u.id, u.username)}
                    disabled={u.id === currentUser?.id || busyUserId === u.id}
                    className={`mt-4 w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${
                      u.id === currentUser?.id
                        ? "cursor-not-allowed border-transparent text-[var(--color-text-muted)] opacity-45"
                        : u.is_admin
                        ? "border-red-500/20 bg-red-500/5 text-red-300 hover:bg-red-500/10"
                        : "border-[var(--color-border-accent)] bg-[var(--brand-gradient-soft)] text-[var(--color-text-primary)] hover:brightness-110"
                    }`}
                  >
                    {busyUserId === u.id ? "Guardando..." : u.is_admin ? "Quitar admin" : "Hacer admin"}
                  </button>
                </article>
              );
            })
          )}
        </div>

        {filteredUsers.length > 8 && (
          <div className="mt-6 flex justify-center">
            <button type="button" onClick={() => setShowAllAccounts((prev) => !prev)} className="btn-secondary text-sm">
              {showAllAccounts ? "Mostrar menos" : `Ver todas las cuentas (${filteredUsers.length})`}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
