import { useEffect, useState } from "react";
import { adminListUsers, adminToggleAdmin } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleToggleAdmin = async (userId: number, username: string) => {
    if (userId === currentUser?.id) {
      alert("No puedes quitarte el rol de administrador a ti mismo.");
      return;
    }
    if (!window.confirm(`¿Seguro que deseas modificar el rol de administrador de ${username}?`)) {
      return;
    }
    try {
      await adminToggleAdmin(userId);
      // reload
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Error al modificar permisos.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute metrics
  const totalUsers = users.length;
  const activeAdmins = users.filter((u) => u.is_admin).length;
  const totalTasks = users.reduce((acc, curr) => acc + curr.tasks_count, 0);
  const totalHabits = users.reduce((acc, curr) => acc + curr.habits_count, 0);
  const totalDiaries = users.reduce((acc, curr) => acc + curr.diary_count, 0);
  const totalWhatsApp = users.filter((u) => u.whatsapp_active).length;

  if (loading && users.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)] text-sm">Cargando Panel de Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Panel de Administrador
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Supervisa las cuentas de usuario, métricas globales de interacción y privilegios del sistema.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Usuarios Totales", val: totalUsers, icon: "👤" },
          { label: "Administradores", val: activeAdmins, icon: "🛡️" },
          { label: "Tareas Totales", val: totalTasks, icon: "📋" },
          { label: "Hábitos Totales", val: totalHabits, icon: "🔥" },
          { label: "Diarios Creados", val: totalDiaries, icon: "📖" },
          { label: "WhatsApp Activo", val: totalWhatsApp, icon: "💬" },
        ].map((m, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] flex flex-col justify-between"
          >
            <div className="flex justify-between items-center text-xl">
              <span>{m.icon}</span>
            </div>
            <div className="mt-4">
              <span className="block text-2xl font-bold text-[var(--color-text-primary)]">
                {m.val}
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] mt-1">
                {m.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="p-6 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Lista de Cuentas de Usuario
          </h2>
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              placeholder="Buscar por usuario o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/[0.02] border border-[var(--color-border-default)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.04] text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Correo</th>
                <th className="py-3 px-4">Enfoque</th>
                <th className="py-3 px-4 text-center">Tareas</th>
                <th className="py-3 px-4 text-center">Hábitos</th>
                <th className="py-3 px-4 text-center">Diarios</th>
                <th className="py-3 px-4 text-center">Rol</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all text-sm"
                  >
                    <td className="py-4 px-4 font-medium text-[var(--color-text-primary)]">
                      {u.username}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Tú
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-[var(--color-text-secondary)]">{u.email}</td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/[0.04] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] capitalize">
                        {u.profile_focus || "personal"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-[var(--color-text-secondary)]">
                      {u.tasks_count}
                    </td>
                    <td className="py-4 px-4 text-center text-[var(--color-text-secondary)]">
                      {u.habits_count}
                    </td>
                    <td className="py-4 px-4 text-center text-[var(--color-text-secondary)]">
                      {u.diary_count}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.is_admin
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-white/[0.02] text-[var(--color-text-muted)] border border-white/[0.04]"
                        }`}
                      >
                        {u.is_admin ? "Admin" : "Usuario"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleToggleAdmin(u.id, u.username)}
                        disabled={u.id === currentUser?.id}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          u.id === currentUser?.id
                            ? "opacity-30 cursor-not-allowed border-transparent text-[var(--color-text-muted)]"
                            : u.is_admin
                            ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        {u.is_admin ? "Quitar Admin" : "Hacer Admin"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
