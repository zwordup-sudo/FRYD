import React, { useState, useEffect } from "react";
import {
  getMyProjects,
  createProject,
  joinProject,
  getProjectLeaderboard,
  createProjectTask,
  updateProjectTask,
  getProjectTasks,
  completeProjectTask,
  getProjectFeed,
  postProjectFeedMessage,
  getProjectAnalytics,
  getProjectAICoach,
  getMe,
} from "../../services/api";
import ReactMarkdown from "react-markdown";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from "recharts";
import KanbanBoard from "./KanbanBoard";


// SVG Icons
const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 4a5 5 0 01-10 0 5 5 0 0110 0zM19 12l2-2m-2 2l-5 5m5-5l-4-4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "board" | "feed" | "leaderboard" | "analytics">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Methodology-specific states
  const [impediments, setImpediments] = useState<string[]>([]);
  const [newImpediment, setNewImpediment] = useState("");
  const [activePhase, setActivePhase] = useState("Requisitos");

  // Modal display toggles
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form states for Projects
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [methodology, setMethodology] = useState("kanban");
  const [customColumns, setCustomColumns] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // Form states for Tasks
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskColumn, setTaskColumn] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState<string>("");
  const [taskStoryPoints, setTaskStoryPoints] = useState(1);
  const [taskXpReward, setTaskXpReward] = useState(15);
  const [taskDueDate, setTaskDueDate] = useState("");

  // Edit task states
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Selected project details
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [projectTasksList, setProjectTasksList] = useState<any[]>([]);
  const [projectFeedList, setProjectFeedList] = useState<any[]>([]);
  const [feedMessage, setFeedMessage] = useState("");

  // Analytics & AI Coach state
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [aiCoachResponse, setAiCoachResponse] = useState<string | null>(null);
  const [loadingAiCoach, setLoadingAiCoach] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const stored = localStorage.getItem(`fryd_project_impediments_${selectedProject.id}`);
      setImpediments(stored ? JSON.parse(stored) : []);
      const phase = localStorage.getItem(`fryd_project_phase_${selectedProject.id}`);
      setActivePhase(phase || "Requisitos");
    }
  }, [selectedProject]);

  const fetchCurrentUser = async () => {
    try {
      const user = await getMe();
      setCurrentUser(user);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyProjects();
      setProjects(data);
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar tus proyectos. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (projectId: number) => {
    try {
      setLoadingAnalytics(true);
      const data = await getProjectAnalytics(projectId);
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching project analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleGenerateAiCoach = async (projectId: number) => {
    try {
      setLoadingAiCoach(true);
      setAiCoachResponse(null);
      const data = await getProjectAICoach(projectId);
      setAiCoachResponse(data.response);
    } catch (err: any) {
      console.error("Error calling AI Coach:", err);
      setError("No se pudo conectar con el Entrenador de IA. Cargando recomendación heurística local...");
      setAiCoachResponse("### 📋 Recomendación Temporal\nNo se pudo obtener el diagnóstico del Entrenador de IA. Revisa la consola para más detalles.");
    } finally {
      setLoadingAiCoach(false);
    }
  };

  const handleExportCSV = (project: any, members: any[], tasks: any[]) => {
    if (!project) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Reporte de Proyecto: ${project.name}\n`;
    csvContent += `Metodologia: ${project.methodology.toUpperCase()}\n`;
    csvContent += `Fecha de Generacion: ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += "CONTRIBUCIONES DEL EQUIPO\n";
    csvContent += "Usuario,Tareas Completadas,Story Points (XP)\n";
    members.forEach(m => {
      csvContent += `"${m.username}",${m.tasks_completed || 0},${m.story_points || 0}\n`;
    });
    
    csvContent += "\nDETALLE DE TAREAS\n";
    csvContent += "Titulo,Descripcion,Columna,Story Points,XP Reward,Fecha Limite,Asignado a\n";
    tasks.forEach(t => {
      const assignedName = t.assigned_to_username || "Sin asignar";
      const dueDateStr = t.due_date ? new Date(t.due_date).toLocaleDateString() : "Sin fecha";
      csvContent += `"${t.title.replace(/"/g, '""')}","${(t.description || '').replace(/"/g, '""')}","${t.column_name}",${t.story_points || 0},${t.xp_reward || 0},"${dueDateStr}","${assignedName}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FRYD_Reporte_${project.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectProject = async (project: any) => {
    setSelectedProject(project);
    setActiveTab("overview");
    await handleRefreshProjectDetails(project.id);
  };

  const handleRefreshProjectDetails = async (projectId: number) => {
    try {
      const [membersData, tasksData, feedData] = await Promise.all([
        getProjectLeaderboard(projectId),
        getProjectTasks(projectId),
        getProjectFeed(projectId),
      ]);
      setProjectMembers(membersData);
      setProjectTasksList(tasksData);
      setProjectFeedList(feedData);
      
      await fetchAnalytics(projectId);
    } catch (err) {
      console.error("Error refreshing project details:", err);
    }
  };

  const handleAddImpediment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImpediment.trim() || !selectedProject) return;
    const updated = [...impediments, newImpediment.trim()];
    setImpediments(updated);
    localStorage.setItem(`fryd_project_impediments_${selectedProject.id}`, JSON.stringify(updated));
    setNewImpediment("");
  };

  const handleRemoveImpediment = (index: number) => {
    if (!selectedProject) return;
    const updated = impediments.filter((_, i) => i !== index);
    setImpediments(updated);
    localStorage.setItem(`fryd_project_impediments_${selectedProject.id}`, JSON.stringify(updated));
  };

  const handleSetPhase = (phase: string) => {
    if (!selectedProject) return;
    setActivePhase(phase);
    localStorage.setItem(`fryd_project_phase_${selectedProject.id}`, phase);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setLoading(true);
      const newProj = await createProject({
        name: projectName,
        description: projectDescription || undefined,
        methodology,
        custom_columns: methodology === "custom" ? customColumns : undefined,
      });
      setProjectName("");
      setProjectDescription("");
      setMethodology("kanban");
      setCustomColumns("");
      setShowCreateModal(false);
      await fetchProjects();
      handleSelectProject(newProj);
    } catch (err: any) {
      console.error(err);
      setError("Error al crear el proyecto. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const joined = await joinProject(inviteCode);
      setInviteCode("");
      setShowJoinModal(false);
      await fetchProjects();
      handleSelectProject(joined);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Código de invitación inválido o ya eres miembro de este proyecto."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedMessage.trim() || !selectedProject) return;

    try {
      const newMsg = await postProjectFeedMessage(selectedProject.id, feedMessage);
      setFeedMessage("");
      setProjectFeedList([newMsg, ...projectFeedList]);
    } catch (err) {
      console.error("Error posting message:", err);
    }
  };

  const handleOpenAddTask = (columnName: string) => {
    setTaskColumn(columnName);
    setTaskTitle("");
    setTaskDescription("");
    setTaskAssignedTo("");
    setTaskStoryPoints(1);
    setTaskXpReward(15);
    setTaskDueDate("");
    setShowAddTaskModal(true);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProject) return;

    try {
      setLoading(true);
      await createProjectTask(selectedProject.id, {
        title: taskTitle,
        description: taskDescription || undefined,
        column_name: taskColumn,
        assigned_to: taskAssignedTo ? parseInt(taskAssignedTo, 10) : null,
        story_points: taskStoryPoints,
        xp_reward: taskXpReward,
        due_date: taskDueDate || null,
      });

      setShowAddTaskModal(false);
      await handleRefreshProjectDetails(selectedProject.id);
    } catch (err: any) {
      console.error(err);
      setError("Error al crear la tarea.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditTask = (task: any) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskColumn(task.column_name);
    setTaskAssignedTo(task.assigned_to ? task.assigned_to.toString() : "");
    setTaskStoryPoints(task.story_points);
    setTaskXpReward(task.xp_reward);
    setTaskDueDate(task.due_date ? task.due_date.substring(0, 10) : "");
    setShowEditTaskModal(true);
  };

  const handleEditTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !editingTask || !selectedProject) return;

    try {
      setLoading(true);
      await updateProjectTask(editingTask.id, {
        title: taskTitle,
        description: taskDescription || undefined,
        column_name: taskColumn,
        assigned_to: taskAssignedTo ? parseInt(taskAssignedTo, 10) : null,
        story_points: taskStoryPoints,
        due_date: taskDueDate || null,
      });

      setShowEditTaskModal(false);
      setEditingTask(null);
      await handleRefreshProjectDetails(selectedProject.id);
    } catch (err: any) {
      console.error(err);
      setError("Error al actualizar la tarea.");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveTask = async (taskId: number, newColumnName: string) => {
    if (!selectedProject) return;
    try {
      // Find the task locally and update immediately
      const updatedTasks = projectTasksList.map((t) => {
        if (t.id === taskId) {
          return { ...t, column_name: newColumnName };
        }
        return t;
      });
      setProjectTasksList(updatedTasks);

      // Call API
      await updateProjectTask(taskId, { column_name: newColumnName });

      // If it's the final column, check if we should complete it
      const cols = selectedProject.custom_columns.split(",");
      const isLast = newColumnName === cols[cols.length - 1];
      const task = projectTasksList.find((t) => t.id === taskId);
      if (isLast && task && !task.completed) {
        await handleCompleteTask(taskId);
      } else {
        await handleRefreshProjectDetails(selectedProject.id);
      }
    } catch (err) {
      console.error("Error moving task:", err);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    if (!selectedProject) return;
    try {
      await completeProjectTask(taskId);
      await handleRefreshProjectDetails(selectedProject.id);
    } catch (err: any) {
      console.error(err);
      setError("Error al completar la tarea.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getColumnsList = () => {
    if (!selectedProject || !selectedProject.custom_columns) return [];
    return selectedProject.custom_columns.split(",");
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] animate-fadeIn">
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-between">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-xs hover:underline cursor-pointer">Cerrar</button>
        </div>
      )}

      {!selectedProject ? (
        // --- PROJECTS DASHBOARD LIST ---
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Desarrollo de Proyectos
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Colabora con metodologías ágiles en tableros interactivos e impulsa a tu equipo.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-secondary cursor-pointer"
              >
                <KeyIcon />
                Unirse con Código
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary cursor-pointer"
              >
                <PlusIcon />
                Crear Proyecto
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-accent-primary)]"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="card-static p-12 text-center max-w-xl mx-auto mt-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 text-[var(--color-accent-primary)]">
                <BriefcaseIcon />
              </div>
              <h3 className="text-xl font-bold mb-2">No tienes ningún proyecto activo</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Crea un proyecto seleccionando tu metodología preferida (Kanban, Scrum, Waterfall) e invita a otros miembros.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="btn-secondary cursor-pointer"
                >
                  Unirse a uno
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary cursor-pointer"
                >
                  Crear Proyecto
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj)}
                  className="card cursor-pointer group flex flex-col justify-between h-52"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors line-clamp-1">
                        {proj.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/[0.04] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]">
                        {proj.methodology}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                      {proj.description || "Sin descripción proporcionada."}
                    </p>
                  </div>
                  <div>
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] mb-1 font-medium text-[var(--color-text-muted)]">
                        <span>Progreso Tareas</span>
                        <span className="text-[var(--color-text-primary)]">{proj.task_progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                          style={{ width: `${proj.task_progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {proj.member_count} {proj.member_count === 1 ? "miembro" : "miembros"}
                      </span>
                      <span className="text-[var(--color-accent-primary)] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold">
                        Abrir Tablero →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // --- DETAILED SELECTED PROJECT VIEW ---
        <div>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--color-border-default)]">
            <div className="flex items-start gap-4">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  fetchProjects();
                }}
                className="btn-secondary p-2.5 cursor-pointer"
              >
                <ArrowLeftIcon />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
                    {selectedProject.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    {selectedProject.methodology}
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface-input)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)]">
                    <span>Invitación: <code className="text-emerald-400 font-mono select-all">{selectedProject.invite_code}</code></span>
                    <button
                      onClick={() => copyToClipboard(selectedProject.invite_code)}
                      className="text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      <ClipboardIcon />
                    </button>
                    {copiedCode && <span className="text-[10px] text-emerald-400 ml-1">¡Copiado!</span>}
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1.5">
                  {selectedProject.description || "Sin descripción."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenAddTask(getColumnsList()[0] || "Por hacer")}
                className="btn-primary cursor-pointer"
              >
                <PlusIcon />
                Nueva Tarea
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`
                flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-200 cursor-pointer
                ${
                  activeTab === "overview"
                    ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-md"
                    : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-accent)] hover:text-[var(--color-text-primary)]"
                }
              `}
            >
              📊 Resumen
            </button>
            <button
              onClick={() => setActiveTab("board")}
              className={`
                flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-200 cursor-pointer
                ${
                  activeTab === "board"
                    ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-md"
                    : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-accent)] hover:text-[var(--color-text-primary)]"
                }
              `}
            >
              📋 Tablero Kanban
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`
                flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-200 cursor-pointer
                ${
                  activeTab === "feed"
                    ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-md"
                    : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-accent)] hover:text-[var(--color-text-primary)]"
                }
              `}
            >
              💬 Feed del Proyecto
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`
                flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                transition-all duration-200 cursor-pointer
                ${
                  activeTab === "leaderboard"
                    ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-md"
                    : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-accent)] hover:text-[var(--color-text-primary)]"
                }
              `}
            >
              🏆 Rankings y XP
            </button>
            {selectedProject.owner_id === currentUser?.id && (
              <button
                onClick={() => setActiveTab("analytics")}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all duration-200 cursor-pointer
                  ${
                    activeTab === "analytics"
                      ? "bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)] shadow-md"
                      : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-accent)] hover:text-[var(--color-text-primary)]"
                  }
                `}
              >
                📊 Analíticas Avanzadas
              </button>
            )}
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--color-accent-primary)]"></div>
            </div>
          ) : (
            <div>
              {/* --- OVERVIEW TAB --- */}
              {activeTab === "overview" && selectedProject && (
                <div className="space-y-6 animate-fadeIn">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card-static p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)] font-medium">Tareas Totales</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">{projectTasksList.length}</p>
                      </div>
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="card-static p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)] font-medium">Completadas</p>
                        <p className="text-2xl font-bold mt-1 text-emerald-400">
                          {projectTasksList.filter(t => t.completed).length}
                        </p>
                      </div>
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="card-static p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)] font-medium">Story Points Totales</p>
                        <p className="text-2xl font-bold mt-1 text-indigo-400">
                          {projectTasksList.reduce((acc, t) => acc + (t.story_points || 0), 0)}
                        </p>
                      </div>
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="card-static p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)] font-medium">Puntos Completados</p>
                        <p className="text-2xl font-bold mt-1 text-violet-400">
                          {projectTasksList.filter(t => t.completed).reduce((acc, t) => acc + (t.story_points || 0), 0)}
                        </p>
                      </div>
                      <span className="text-2xl">🔥</span>
                    </div>
                  </div>

                  {/* Adaptive Content depending on methodology */}
                  {selectedProject.methodology === "scrum" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Sprint Burndown chart */}
                      <div className="lg:col-span-2 card-static p-5">
                        <h3 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Burndown del Sprint (Puntos)</h3>
                        <div className="h-60 flex flex-col justify-between">
                          {/* Burndown chart graphic */}
                          <div className="flex-1 flex items-end justify-between px-4 pb-2 border-b border-[var(--color-border-default)] border-l relative">
                            {/* Guide line */}
                            <div className="absolute inset-0 border-t border-dashed border-red-500/20 origin-top-left rotate-[16deg]" />
                            
                            {/* We can construct 5 visual bars representing active vs ideal burn */}
                            {(() => {
                              const totalSP = projectTasksList.reduce((acc, t) => acc + (t.story_points || 0), 0) || 10;
                              const completedSP = projectTasksList.filter(t => t.completed).reduce((acc, t) => acc + (t.story_points || 0), 0);
                              const remainingSP = totalSP - completedSP;
                              
                              return [1, 2, 3, 4, 5].map((day) => {
                                const idealSP = totalSP - ((totalSP / 5) * (day - 1));
                                const currentSP = day <= 3 ? remainingSP : 0; // Simulated active burn
                                const idealPct = (idealSP / totalSP) * 100;
                                const currentPct = (currentSP / totalSP) * 100;
                                
                                return (
                                  <div key={day} className="flex flex-col items-center gap-1.5 w-12 z-10">
                                    <div className="relative w-8 h-40 flex items-end justify-center">
                                      <div className="absolute w-2.5 bg-white/10 rounded-t-sm" style={{ height: `${idealPct}%` }} title="Ideal" />
                                      {day <= 3 && (
                                        <div className="w-4 bg-gradient-to-t from-indigo-600 to-violet-400 rounded-t-sm z-10" style={{ height: `${currentPct}%` }} title="Real" />
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Día {day}</span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-2.5">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-red-400 inline-block rounded-full" /> Línea Ideal</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 bg-indigo-500 inline-block rounded-full" /> Puntos Restantes</span>
                          </div>
                        </div>
                      </div>

                      {/* Impediments list */}
                      <div className="lg:col-span-1 card-static p-5 flex flex-col justify-between min-h-[300px]">
                        <div>
                          <h3 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center justify-between">
                            <span>🚫 Impedimentos / Bloqueos</span>
                            <span className="badge badge-red">{impediments.length}</span>
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
                            Cosas que están demorando el trabajo del equipo. Mantén esta lista limpia.
                          </p>
                          <form onSubmit={handleAddImpediment} className="flex gap-2 mb-4">
                            <input
                              type="text"
                              value={newImpediment}
                              onChange={(e) => setNewImpediment(e.target.value)}
                              placeholder="Nuevo bloqueo..."
                              className="fryd-input py-1 px-2.5 text-xs flex-1"
                              required
                            />
                            <button type="submit" className="btn-primary py-1 px-3 text-xs cursor-pointer">Añadir</button>
                          </form>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {impediments.length === 0 ? (
                              <p className="text-xs text-[var(--color-text-muted)] italic text-center py-4">Sin bloqueos activos. ¡Buen trabajo!</p>
                            ) : (
                              impediments.map((imp, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-200">
                                  <span className="truncate flex-1 pr-2">{imp}</span>
                                  <button
                                    onClick={() => handleRemoveImpediment(idx)}
                                    className="text-red-400 hover:text-red-200 font-bold ml-2 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="border-t border-[var(--color-border-default)] pt-4 mt-4">
                          <h4 className="text-[10px] font-bold text-[var(--color-accent-primary)] uppercase tracking-wider mb-1.5">Guía de Metodología: Scrum</h4>
                          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                            Enfócate en cumplir con los compromisos del Sprint Backlog. Evita añadir alcance a mitad de sprint y resuelve bloqueos diariamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProject.methodology === "waterfall" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Gantt phases checklist */}
                      <div className="lg:col-span-2 card-static p-5">
                        <h3 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Cronograma de Fases (Fase Activa: {activePhase})</h3>
                        <div className="space-y-4">
                          {["Requisitos", "Diseño", "Implementación", "Pruebas", "Cerrado"].map((phase, idx) => {
                            const isCurrent = activePhase === phase;
                            const isCompleted = ["Requisitos", "Diseño", "Implementación", "Pruebas", "Cerrado"].indexOf(activePhase) > idx;
                            
                            return (
                              <div
                                key={phase}
                                onClick={() => handleSetPhase(phase)}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                  isCurrent
                                    ? "bg-indigo-600/10 border-indigo-500 shadow-md scale-[1.01]"
                                    : isCompleted
                                      ? "bg-emerald-500/5 border-emerald-500/20 opacity-70"
                                      : "bg-[var(--color-surface-card)] border-[var(--color-border-default)] hover:border-white/10"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isCurrent
                                      ? "bg-indigo-500 text-white"
                                      : isCompleted
                                        ? "bg-emerald-500 text-white"
                                        : "bg-white/5 text-[var(--color-text-muted)]"
                                  }`}>
                                    {isCompleted ? "✓" : idx + 1}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold">{phase}</h4>
                                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                                      {phase === "Requisitos" && "Definición del alcance, especificaciones y objetivos iniciales."}
                                      {phase === "Diseño" && "Arquitectura, wireframes de frontend, modelado de DB y esquemas."}
                                      {phase === "Implementación" && "Escritura de código principal, endpoints del backend y componentes."}
                                      {phase === "Pruebas" && "Pruebas de integración, QA y corrección de bugs."}
                                      {phase === "Cerrado" && "Despliegue a producción, entrega formal y retrospectiva final."}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  isCurrent
                                    ? "bg-indigo-500/20 text-indigo-400"
                                    : isCompleted
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-white/5 text-[var(--color-text-muted)]"
                                }`}>
                                  {isCurrent ? "En progreso" : isCompleted ? "Completado" : "Pendiente"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Milestone checklist */}
                      <div className="lg:col-span-1 card-static p-5 flex flex-col justify-between min-h-[300px]">
                        <div>
                          <h3 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">🎯 Hitos de Fase (Milestones)</h3>
                          <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
                            Asegúrate de completar estos hitos antes de cambiar de fase.
                          </p>
                          <div className="space-y-3 pt-2">
                            {activePhase === "Requisitos" && (
                              <>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Documento de especificaciones aprobado</span>
                                </label>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Presupuesto y cronograma firmados</span>
                                </label>
                              </>
                            )}
                            {activePhase === "Diseño" && (
                              <>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Wireframes de UI aprobados</span>
                                </label>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Diagrama Entidad-Relación de DB listo</span>
                                </label>
                              </>
                            )}
                            {activePhase === "Implementación" && (
                              <>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Repositorio inicializado y código listo</span>
                                </label>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Endpoints del backend terminados</span>
                                </label>
                              </>
                            )}
                            {activePhase === "Pruebas" && (
                              <>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Pruebas de usuario y corrección de bugs</span>
                                </label>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Auditoría de seguridad completada</span>
                                </label>
                              </>
                            )}
                            {activePhase === "Cerrado" && (
                              <>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Proyecto desplegado en producción</span>
                                </label>
                                <label className="flex items-start gap-2.5 text-xs text-[var(--color-text-secondary)]">
                                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 cursor-pointer text-indigo-500" />
                                  <span>Retrospectiva del equipo archivada</span>
                                </label>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-[var(--color-border-default)] pt-4 mt-6">
                          <h4 className="text-[10px] font-bold text-[var(--color-accent-primary)] uppercase tracking-wider mb-1.5">Guía de Metodología: Waterfall</h4>
                          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                            Waterfall es una metodología secuencial. Asegúrate de cerrar todos los requisitos de la fase actual antes de pasar a la siguiente fase de desarrollo.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedProject.methodology === "kanban" || selectedProject.methodology === "lean") && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Flow diagnostics */}
                      <div className="lg:col-span-2 card-static p-5">
                        <h3 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Diagnóstico de Flujo Kanban</h3>
                        
                        {/* WIP limit indicator */}
                        {(() => {
                          const wipCount = projectTasksList.filter(t => t.column_name === "En progreso").length;
                          const limitExceeded = wipCount > 3;
                          
                          return (
                            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 ${
                              limitExceeded
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                : "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                            }`}>
                              <div>
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                  {limitExceeded ? "⚠️ Límite WIP Excedido (Límite sugerido: 3)" : "✅ Flujo de Trabajo Saludable"}
                                </h4>
                                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                                  {limitExceeded
                                    ? "Tienes demasiadas tareas activas al mismo tiempo. Intenta terminar lo que empezaste antes de tomar nuevos pendientes."
                                    : "El volumen de tareas en progreso está dentro del rango óptimo para maximizar el throughput."}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-semibold">WIP:</span>
                                <span className={`text-lg font-bold px-3 py-1 rounded-lg ${
                                  limitExceeded ? "bg-amber-500/20" : "bg-emerald-500/20"
                                }`}>
                                  {wipCount} / 3
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* cycle time / throughput */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)]">
                            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Tiempo de Ciclo Promedio</h4>
                            <p className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">2.4 días</p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">Tiempo promedio desde que una tarea entra a 'En progreso' hasta que se completa.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-default)]">
                            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Rendimiento (Throughput)</h4>
                            <p className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">
                              {projectTasksList.filter(t => t.completed).length} tareas
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">Total de tareas entregadas en este proyecto hasta la fecha.</p>
                          </div>
                        </div>
                      </div>

                      {/* guide details */}
                      <div className="lg:col-span-1 card-static p-5 flex flex-col justify-between min-h-[300px]">
                        <div>
                          <h3 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">🛠️ Principios de Kanban</h3>
                          <ul className="space-y-3 text-xs text-[var(--color-text-secondary)] list-disc list-inside">
                            <li>Visualizar el flujo de trabajo en el tablero.</li>
                            <li>Limitar el Trabajo en Progreso (WIP) para evitar la sobrecarga y cuellos de botella.</li>
                            <li>Gestionar activamente el flujo.</li>
                            <li>Hacer explícitas las políticas de las columnas.</li>
                            <li>Mejorar colaborativamente.</li>
                          </ul>
                        </div>
                        <div className="border-t border-[var(--color-border-default)] pt-4 mt-6">
                          <h4 className="text-[10px] font-bold text-[var(--color-accent-primary)] uppercase tracking-wider mb-1.5">Guía de Metodología: Kanban / Lean</h4>
                          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                            Esta metodología fomenta el desarrollo continuo y eficiente eliminando el desperdicio y optimizando el flujo de valor.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProject.methodology === "custom" && (
                    <div className="card-static p-6 text-center max-w-xl mx-auto">
                      <span className="text-4xl">⚙️</span>
                      <h3 className="text-lg font-bold mt-4 mb-2 text-[var(--color-text-primary)]">Tablero Personalizado</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                        Has configurado columnas personalizadas para este proyecto. Ve a la pestaña **Tablero Kanban** para organizar y mover tus tareas de acuerdo a tu flujo de trabajo diseñado.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* --- KANBAN BOARD TAB --- */}
              {activeTab === "board" && (
                <KanbanBoard
                  columns={getColumnsList()}
                  tasks={projectTasksList}
                  members={projectMembers}
                  onMoveTask={handleMoveTask}
                  onEditTask={handleOpenEditTask}
                  onAddTask={handleOpenAddTask}
                  onCompleteTask={handleCompleteTask}
                />
              )}

              {/* --- FEED TAB --- */}
              {activeTab === "feed" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                  {/* Post Form */}
                  <div className="lg:col-span-1">
                    <div className="card-static p-5 sticky top-6 bg-gradient-to-b from-[var(--color-surface-card)] to-white/[0.01] border border-[var(--color-border-default)] shadow-xl rounded-2xl">
                      <h3 className="font-extrabold text-base text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
                        💬 Muro del Proyecto
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] mb-4">Comparte anuncios, bloqueos o novedades con el equipo.</p>
                      
                      <form onSubmit={handlePostMessage} className="flex flex-col gap-4">
                        <textarea
                          value={feedMessage}
                          onChange={(e) => setFeedMessage(e.target.value)}
                          placeholder="Escribe tu mensaje aquí..."
                          className="fryd-input min-h-[120px] resize-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/50 focus:border-[var(--color-accent-primary)] transition-all"
                          maxLength={300}
                          required
                        />
                        <button
                          type="submit"
                          className="btn-primary w-full py-2.5 rounded-xl font-bold cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Publicar
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Feed List (Timeline) */}
                  <div className="lg:col-span-2">
                    {projectFeedList.length === 0 ? (
                      <div className="text-center py-20 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-default)] rounded-3xl bg-white/[0.01] flex flex-col items-center justify-center">
                        <span className="text-3xl mb-3">📭</span>
                        <p className="font-semibold text-sm">El muro está vacío</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Sé el primero en publicar una actualización.</p>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-white/[0.06] ml-4 pl-8 space-y-6 py-2">
                        {projectFeedList.map((msg) => {
                          // Determine type, colors and icon
                          let type = "comment";
                          let icon = "💬";
                          let badgeStyle = "bg-violet-500/10 text-violet-400 border-violet-500/20";
                          let cardGlow = "hover:border-violet-500/20";
                          let headerText = msg.username || "Miembro";

                          if (msg.is_achievement) {
                            type = "achievement";
                            icon = "🏆";
                            badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                            cardGlow = "bg-gradient-to-br from-amber-500/[0.02] to-transparent border-amber-500/20 hover:border-amber-500/40";
                            headerText = "Logro del Proyecto";
                          } else if (msg.content.includes("completó") || msg.content.includes("completo")) {
                            type = "completion";
                            icon = "✅";
                            badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                            cardGlow = "bg-gradient-to-br from-emerald-500/[0.01] to-transparent border-emerald-500/15 hover:border-emerald-500/30";
                          } else if (msg.content.includes("movió") || msg.content.includes("movio")) {
                            type = "move";
                            icon = "🔄";
                            badgeStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                            cardGlow = "hover:border-indigo-500/20";
                          } else if (msg.content.includes("agregada") || msg.content.includes("creada")) {
                            type = "creation";
                            icon = "🎯";
                            badgeStyle = "bg-sky-500/10 text-sky-400 border-sky-500/20";
                            cardGlow = "hover:border-sky-500/20";
                          }

                          return (
                            <div key={msg.id} className="relative group/item">
                              {/* Timeline dot */}
                              <div className={`absolute -left-[45px] top-2 w-8 h-8 rounded-full bg-[var(--color-bg-primary)] border-2 border-[var(--color-border-default)] group-hover/item:border-[var(--color-accent-primary)] flex items-center justify-center text-sm shadow-lg transition-all duration-300 z-10`}>
                                {icon}
                              </div>

                              {/* Message card */}
                              <div className={`card-static p-4.5 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 ${cardGlow}`}>
                                <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-white/[0.03]">
                                  <div className="flex items-center gap-2">
                                    {/* Avatar initials fallback */}
                                    <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${
                                      msg.is_achievement ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white"
                                    }`}>
                                      {headerText.slice(0, 2)}
                                    </div>
                                    <span className="font-bold text-xs text-[var(--color-text-primary)]">
                                      {headerText}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${badgeStyle}`}>
                                      {type === "achievement" ? "Logro" : type === "completion" ? "Completado" : type === "move" ? "Movimiento" : type === "creation" ? "Nueva Tarea" : "Mensaje"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                                    {new Date(msg.created_at).toLocaleString("es-ES", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })}
                                  </span>
                                </div>
                                <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[var(--color-text-secondary)] font-medium">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- LEADERBOARD TAB --- */}
              {activeTab === "leaderboard" && (
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Rankings */}
                  <div className="card-static overflow-hidden">
                    <div className="p-4 bg-white/[0.02] border-b border-[var(--color-border-default)] text-xs font-bold text-[var(--color-text-muted)] flex items-center">
                      <span className="w-12 text-center">Rango</span>
                      <span className="flex-1">Miembro</span>
                      <span className="w-24 text-right">Puntos Proyecto</span>
                    </div>

                    <div className="divide-y divide-[var(--color-border-default)]">
                      {projectMembers.map((member, index) => {
                        return (
                          <div key={member.user_id} className="p-4 flex items-center hover:bg-white/[0.01] transition-all">
                            <span className="w-12 text-center text-sm font-bold text-[var(--color-text-secondary)]">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                                {member.username}
                              </p>
                              <p className="text-[10px] text-[var(--color-text-muted)] capitalize">
                                Rol: {member.role === "owner" ? "Dueño" : "Miembro"}
                              </p>
                            </div>
                            <span className="w-24 text-right text-sm font-bold text-emerald-400">
                              {member.points_earned} XP
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- ANALYTICS TAB --- */}
              {activeTab === "analytics" && selectedProject && (
                <div className="space-y-8 animate-fadeIn print:space-y-4">
                  {/* Style for print optimization */}
                  <style>{`
                    @media print {
                      body, html, #root {
                        background: #ffffff !important;
                        color: #000000 !important;
                      }
                      .no-print {
                        display: none !important;
                      }
                      .print-card {
                        background: #ffffff !important;
                        border: 1px solid #e2e8f0 !important;
                        color: #000000 !important;
                        box-shadow: none !important;
                        page-break-inside: avoid;
                      }
                      .print-text {
                        color: #000000 !important;
                      }
                      .print-title {
                        color: #000000 !important;
                        background: none !important;
                        -webkit-text-fill-color: initial !important;
                      }
                    }
                  `}</style>

                  {/* Top Bar / Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print pb-2 border-b border-[var(--color-border-default)]">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Analíticas de Productividad</h2>
                      <p className="text-xs text-[var(--color-text-muted)]">Monitorea el progreso del equipo y obtén diagnósticos inteligentes.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleExportCSV(selectedProject, analyticsData?.member_contributions || [], projectTasksList)}
                        className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
                        disabled={loadingAnalytics}
                      >
                        📥 Exportar CSV
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
                        disabled={loadingAnalytics}
                      >
                        🖨️ Imprimir Reporte
                      </button>
                    </div>
                  </div>

                  {loadingAnalytics ? (
                    <div className="flex justify-center items-center py-20">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--color-accent-primary)]"></div>
                    </div>
                  ) : analyticsData ? (
                    <>
                      {/* KPIs Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Flow Health Index Circular Chart */}
                        <div className="print-card card-static p-5 flex flex-col items-center justify-center text-center">
                          <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Salud del Flujo</h4>
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                className="stroke-[var(--color-border-default)] fill-none"
                                strokeWidth="8"
                              />
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                className="stroke-emerald-400 fill-none transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - (analyticsData.kpis?.flow_health || 0) / 100)}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-xl font-black text-emerald-400">
                              {analyticsData.kpis?.flow_health}%
                            </span>
                          </div>
                        </div>

                        {/* Completed Tasks */}
                        <div className="print-card card-static p-5 flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Tareas</p>
                            <h3 className="text-3xl font-extrabold mt-2 text-[var(--color-text-primary)] print-text">
                              {analyticsData.kpis?.completed_tasks} <span className="text-sm font-normal text-[var(--color-text-secondary)]">/ {analyticsData.kpis?.total_tasks}</span>
                            </h3>
                          </div>
                          <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded self-start mt-2">
                            {analyticsData.kpis?.total_tasks > 0 
                              ? `${Math.round((analyticsData.kpis.completed_tasks / analyticsData.kpis.total_tasks) * 100)}% Completado`
                              : "0%"}
                          </div>
                        </div>

                        {/* Story Points */}
                        <div className="print-card card-static p-5 flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Story Points</p>
                            <h3 className="text-3xl font-extrabold mt-2 text-indigo-400">
                              {analyticsData.kpis?.completed_story_points} <span className="text-sm font-normal text-[var(--color-text-secondary)]">/ {analyticsData.kpis?.total_story_points}</span>
                            </h3>
                          </div>
                          <div className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded self-start mt-2">
                            {analyticsData.kpis?.total_story_points > 0 
                              ? `${Math.round((analyticsData.kpis.completed_story_points / analyticsData.kpis.total_story_points) * 100)}% Puntos`
                              : "0%"}
                          </div>
                        </div>

                        {/* Active Members */}
                        <div className="print-card card-static p-5 flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Miembros Activos</p>
                            <h3 className="text-3xl font-extrabold mt-2 text-violet-400">
                              {analyticsData.kpis?.active_members}
                            </h3>
                          </div>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-2">Colaboradores con tareas</p>
                        </div>

                        {/* MVP of Sprint */}
                        <div className="print-card card-static p-5 flex flex-col justify-between bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
                          <div>
                            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              👑 MVP Actual
                            </p>
                            <h3 className="text-xl font-bold mt-2 text-white print-text truncate">
                              {analyticsData.kpis?.mvp || "Ninguno"}
                            </h3>
                          </div>
                          <p className="text-[10px] text-emerald-300/80 font-medium mt-2">Mayor aporte de Story Points</p>
                        </div>
                      </div>

                      {/* Productivity & Contributions Charts Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Weekly Productivity Chart */}
                        <div className="print-card card-static p-5 flex flex-col justify-between min-h-[350px]">
                          <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Productividad Semanal (Creadas vs Completadas)</h3>
                          </div>
                          <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={analyticsData.weekly_productivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="week_label" stroke="var(--color-text-muted)" fontSize={11} />
                                <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border-default)" }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="created" name="Creadas" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" name="Completadas" fill="#34d399" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Team Member Contributions Chart */}
                        <div className="print-card card-static p-5 flex flex-col justify-between min-h-[350px]">
                          <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Aporte del Equipo (Story Points completados)</h3>
                          </div>
                          <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={analyticsData.member_contributions}
                                layout="vertical"
                                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} />
                                <YAxis dataKey="username" type="category" stroke="var(--color-text-muted)" fontSize={11} width={80} />
                                <Tooltip contentStyle={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border-default)" }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="story_points" name="Story Points (XP)" fill="#6366f1" radius={[0, 4, 4, 0]}>
                                  {analyticsData.member_contributions.map((entry: any, index: number) => {
                                    const isMVP = entry.username === analyticsData.kpis?.mvp;
                                    return <Cell key={`cell-${index}`} fill={isMVP ? "#10b981" : "#6366f1"} />;
                                  })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* AI Coach Card & Opportunities Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* AI Coach Container (ColSpan 2) */}
                        <div className="lg:col-span-2 print-card card-static p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border-default)] pb-3">
                              <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                🤖 Entrenador de IA FRYD
                              </h3>
                              <button
                                onClick={() => handleGenerateAiCoach(selectedProject.id)}
                                className="btn-primary py-1 px-3 text-xs cursor-pointer no-print"
                                disabled={loadingAiCoach}
                              >
                                {loadingAiCoach ? "Analizando..." : aiCoachResponse ? "Re-diagnosticar" : "Obtener Diagnóstico"}
                              </button>
                            </div>

                            {loadingAiCoach ? (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400 mb-3"></div>
                                <p className="text-xs text-[var(--color-text-muted)] animate-pulse">Analizando rendimiento del equipo, WIP y cuellos de botella...</p>
                              </div>
                            ) : aiCoachResponse ? (
                              <div className="prose prose-invert max-w-none text-xs leading-relaxed max-h-[300px] overflow-y-auto pr-2 bg-black/20 p-4 rounded-xl border border-white/5 font-medium text-[var(--color-text-secondary)] print:max-h-none print:bg-white print:text-black">
                                <ReactMarkdown>{aiCoachResponse}</ReactMarkdown>
                              </div>
                            ) : (
                              <div className="text-center py-12 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-default)] rounded-xl">
                                Presiona &quot;Obtener Diagnóstico&quot; para que el Entrenador de IA analice la productividad del proyecto y te dé recomendaciones clave.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Opportunities Card */}
                        <div className="lg:col-span-1 print-card card-static p-5 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Áreas de Oportunidad</h3>
                            <div className="space-y-3">
                              {!analyticsData.opportunities || analyticsData.opportunities.length === 0 ? (
                                <div className="text-center py-12 text-[var(--color-text-muted)]">
                                  ✨ ¡Todo en orden! No se detectaron cuellos de botella.
                                </div>
                              ) : (
                                analyticsData.opportunities.map((opp: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                                      opp.type === "overdue"
                                        ? "bg-rose-500/5 border-rose-500/10 text-rose-300"
                                        : opp.type === "critical_unassigned"
                                          ? "bg-amber-500/5 border-amber-500/10 text-amber-300"
                                          : "bg-blue-500/5 border-blue-500/10 text-blue-300"
                                    }`}
                                  >
                                    <span className="text-sm">
                                      {opp.type === "overdue" ? "⏳" : opp.type === "critical_unassigned" ? "👤" : "⚡"}
                                    </span>
                                    <div>
                                      <h4 className="text-xs font-bold">{opp.title}</h4>
                                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{opp.desc}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-[var(--color-text-muted)]">
                      No se pudieron cargar los datos de analíticas.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- CREATE PROJECT MODAL --- */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content card-static w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Crear un Nuevo Proyecto</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost p-1 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej. Rediseño Web, Campaña Q3..."
                  className="fryd-input"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="De qué se trata el proyecto, objetivos, entregables..."
                  className="fryd-input min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Metodología
                </label>
                <select
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="fryd-input select-styled cursor-pointer"
                >
                  <option value="kanban">Kanban (Por hacer, En progreso, QA, Completado)</option>
                  <option value="scrum">Scrum (Backlog, Por hacer, En progreso, QA, Finalizado)</option>
                  <option value="waterfall">Waterfall (Requisitos, Diseño, Implementación, Pruebas, Cerrado)</option>
                  <option value="lean">Lean (Por hacer, En progreso, Completado)</option>
                  <option value="custom">Personalizada...</option>
                </select>
              </div>

              {methodology === "custom" && (
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Columnas Personalizadas (Separadas por comas)
                  </label>
                  <input
                    type="text"
                    value={customColumns}
                    onChange={(e) => setCustomColumns(e.target.value)}
                    placeholder="Ej. Ideación, Diseño, QA, Desplegado"
                    className="fryd-input"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1 cursor-pointer">
                  Crear Proyecto
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- JOIN PROJECT MODAL --- */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content card-static w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Unirse a un Proyecto</h3>
              <button onClick={() => setShowJoinModal(false)} className="btn-ghost p-1 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleJoinProject} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Código de Invitación
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Ej. PROJ-ABCDEF12"
                  className="fryd-input font-mono uppercase"
                  required
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1 cursor-pointer">
                  Unirse
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="btn-secondary cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD TASK MODAL --- */}
      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="modal-content card-static w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Crear Tarea</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="btn-ghost p-1 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateTaskSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Título de la Tarea
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ej. Diseñar wireframe de landing"
                  className="fryd-input"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Descripción
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Detalles sobre los requerimientos, criterios de aceptación..."
                  className="fryd-input min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Story Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={taskStoryPoints}
                    onChange={(e) => setTaskStoryPoints(parseInt(e.target.value, 10))}
                    className="fryd-input"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Recompensa (XP)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={taskXpReward}
                    onChange={(e) => setTaskXpReward(parseInt(e.target.value, 10))}
                    className="fryd-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Asignar a
                  </label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="fryd-input select-styled cursor-pointer"
                  >
                    <option value="">Sin asignar</option>
                    {projectMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id.toString()}>
                        {m.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="fryd-input"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1 cursor-pointer">
                  Crear Tarea
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="btn-secondary cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT TASK MODAL --- */}
      {showEditTaskModal && (
        <div className="modal-overlay" onClick={() => setShowEditTaskModal(false)}>
          <div className="modal-content card-static w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Editar Tarea</h3>
              <button onClick={() => setShowEditTaskModal(false)} className="btn-ghost p-1 cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleEditTaskSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Título de la Tarea
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="fryd-input"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                  Descripción
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="fryd-input min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Story Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={taskStoryPoints}
                    onChange={(e) => setTaskStoryPoints(parseInt(e.target.value, 10))}
                    className="fryd-input"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Columna Actual
                  </label>
                  <select
                    value={taskColumn}
                    onChange={(e) => setTaskColumn(e.target.value)}
                    className="fryd-input select-styled cursor-pointer"
                  >
                    {getColumnsList().map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Asignar a
                  </label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="fryd-input select-styled cursor-pointer"
                  >
                    <option value="">Sin asignar</option>
                    {projectMembers.map((m) => (
                      <option key={m.user_id} value={m.user_id.toString()}>
                        {m.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="fryd-input"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary flex-1 cursor-pointer">
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditTaskModal(false)}
                  className="btn-secondary cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
