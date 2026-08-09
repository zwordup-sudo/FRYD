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
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";
import SegmentedTabs from "../../components/ui/SegmentedTabs";
import StatTile from "../../components/ui/StatTile";


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

type ProjectTabKey = "overview" | "board" | "feed" | "leaderboard" | "analytics";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectTabKey>("overview");
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

  const averageProjectProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.task_progress || 0), 0) / projects.length)
    : 0;
  const totalProjectMembers = projects.reduce((sum, project) => sum + Number(project.member_count || 0), 0);
  const methodologyCount = new Set(projects.map((project) => project.methodology)).size;
  const completedProjectTasks = projectTasksList.filter((task) => task.completed).length;
  const selectedProjectProgress = projectTasksList.length
    ? Math.round((completedProjectTasks / projectTasksList.length) * 100)
    : Number(selectedProject?.task_progress || 0);

  const projectTabs: Array<{ key: ProjectTabKey; label: string; count?: number }> = [
    { key: "overview" as const, label: "Resumen" },
    { key: "board" as const, label: "Tablero" },
    { key: "feed" as const, label: "Feed", count: projectFeedList.length },
    { key: "leaderboard" as const, label: "Equipo", count: projectMembers.length },
    ...(selectedProject?.owner_id === currentUser?.id
      ? [{ key: "analytics" as const, label: "Analíticas" }]
      : []),
  ];

  return (
    <div className="animate-fade-in">
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center justify-between">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-xs hover:underline cursor-pointer">Cerrar</button>
        </div>
      )}

      {!selectedProject ? (
        <div className="animate-fade-in">
          <PageHeader
            eyebrow="TRABAJO"
            title="Proyectos"
            description="Convierte objetivos grandes en sistemas de trabajo claros, comparte el avance con tu equipo y mantén el contexto en un solo lugar."
            action={
              <div className="flex flex-wrap items-center gap-2.5">
                <button type="button" onClick={() => setShowJoinModal(true)} className="btn-secondary">
                  <KeyIcon />
                  Unirse con código
                </button>
                <button type="button" onClick={() => setShowCreateModal(true)} className="btn-primary">
                  <PlusIcon />
                  Nuevo proyecto
                </button>
              </div>
            }
          />

          {loading ? (
            <div className="fryd-panel min-h-[22rem] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-[var(--color-text-muted)]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/10 border-t-[var(--color-accent-primary)]" />
                <span className="text-sm">Cargando tu espacio de trabajo...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-3.5 gap-y-6 mb-10">
                <StatTile label="Proyectos activos" value={projects.length} detail="Espacios de trabajo" tone="brand" icon={<BriefcaseIcon />} />
                <StatTile label="Progreso promedio" value={`${averageProjectProgress}%`} detail="Avance entre proyectos" tone="success" icon={<span>↗</span>} />
                <StatTile label="Colaboradores" value={totalProjectMembers} detail="Miembros en tus proyectos" tone="muted" icon={<span>◎</span>} />
                <StatTile label="Metodologías" value={methodologyCount} detail="Formas de trabajo activas" tone="warning" icon={<span>◇</span>} />
              </div>

              {projects.length === 0 ? (
                <div className="fryd-panel py-14 px-6 text-center max-w-2xl mx-auto">
                  <div className="w-14 h-14 rounded-2xl brand-gradient-soft border border-[var(--color-border-accent)] flex items-center justify-center mx-auto mb-5 text-[#8b93ff]">
                    <BriefcaseIcon />
                  </div>
                  <p className="fryd-section-label mb-2">TU PRIMER ESPACIO</p>
                  <h2 className="text-xl font-semibold tracking-[-0.02em]">Todavía no tienes proyectos</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-lg mx-auto">
                    Crea un proyecto para organizar trabajo por metodología o únete a uno existente con un código de invitación.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2.5 mt-6">
                    <button type="button" onClick={() => setShowJoinModal(true)} className="btn-secondary">Unirme a uno</button>
                    <button type="button" onClick={() => setShowCreateModal(true)} className="btn-primary"><PlusIcon /> Crear proyecto</button>
                  </div>
                </div>
              ) : (
                <section>
                  <div className="flex items-end justify-between gap-4 mb-4">
                    <div>
                      <p className="fryd-section-label mb-1.5">TU PORTAFOLIO</p>
                      <h2 className="text-lg font-semibold tracking-[-0.02em]">Espacios de trabajo</h2>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">{projects.length} {projects.length === 1 ? "proyecto" : "proyectos"}</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-x-4 gap-y-7">
                    {projects.map((proj, index) => {
                      const progress = Math.max(0, Math.min(100, Number(proj.task_progress || 0)));
                      const method = String(proj.methodology || "kanban").toUpperCase();
                      return (
                        <button
                          type="button"
                          key={proj.id}
                          onClick={() => handleSelectProject(proj)}
                          className={`fryd-project-card text-left animate-fade-in delay-${Math.min(index + 1, 6)}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="fryd-project-emblem" aria-hidden="true">
                                <span>{String(proj.name || "P").trim().charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-semibold text-[var(--color-text-primary)] truncate">{proj.name}</h3>
                                  <span className="badge badge-purple text-[10px]">{method}</span>
                                </div>
                                <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] line-clamp-2 min-h-[2.6rem]">
                                  {proj.description || "Sin descripción. Abre el proyecto para organizar sus tareas y próximos pasos."}
                                </p>
                              </div>
                            </div>
                            <span className="fryd-project-arrow" aria-hidden="true">→</span>
                          </div>

                          <div className="mt-6">
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-[var(--color-text-muted)]">Progreso</span>
                              <span className="font-semibold text-[var(--color-text-primary)]">{progress}%</span>
                            </div>
                            <div className="brand-progress-track h-2 rounded-full overflow-hidden">
                              <div className="brand-progress-fill h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[var(--color-border-subtle)]">
                            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H2v-2a4 4 0 014-4h3m4 6v-2a4 4 0 00-4-4H6m7 6h4v-2a4 4 0 00-4-4h-2m2-5a4 4 0 110-8 4 4 0 010 8z" /></svg>
                              {proj.member_count || 0} {Number(proj.member_count || 0) === 1 ? "miembro" : "miembros"}
                            </span>
                            <span className="text-xs font-semibold text-[#7f88ff]">Abrir workspace</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        // --- DETAILED SELECTED PROJECT VIEW ---
        <div>
          <div className="fryd-project-hero mb-6">
            <div className="fryd-project-hero-accent" aria-hidden="true" />
            <div className="relative z-[1] p-5 sm:p-6 lg:p-7">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject(null);
                      fetchProjects();
                    }}
                    className="btn-secondary p-2.5 flex-shrink-0"
                    aria-label="Volver a proyectos"
                  >
                    <ArrowLeftIcon />
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="fryd-section-label w-full mb-0.5">WORKSPACE DEL PROYECTO</p>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)]">
                        {selectedProject.name}
                      </h1>
                      <span className="badge badge-purple text-[10px] uppercase">{selectedProject.methodology}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-3xl">
                      {selectedProject.description || "Sin descripción. Usa este workspace para coordinar tareas, equipo, actividad y evolución del proyecto."}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-[var(--color-text-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="status-dot status-dot-active" />
                        Proyecto activo
                      </span>
                      <span>{projectMembers.length} {projectMembers.length === 1 ? "miembro" : "miembros"}</span>
                      <span>{projectTasksList.length} {projectTasksList.length === 1 ? "tarea" : "tareas"}</span>
                      <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-black/10 px-2.5 py-1.5">
                        Código <code className="font-mono text-[#8b93ff] select-all">{selectedProject.invite_code}</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedProject.invite_code)}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                          title="Copiar código"
                        >
                          <ClipboardIcon />
                        </button>
                        {copiedCode && <span className="text-[10px] text-[var(--color-accent-success)]">Copiado</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col 2xl:flex-row gap-3 xl:items-end">
                  <div className="min-w-[12rem]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[var(--color-text-muted)]">Avance general</span>
                      <span className="font-semibold">{selectedProjectProgress}%</span>
                    </div>
                    <div className="brand-progress-track h-2 rounded-full overflow-hidden">
                      <div className="brand-progress-fill h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, selectedProjectProgress))}%` }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddTask(getColumnsList()[0] || "Por hacer")}
                    className="btn-primary whitespace-nowrap"
                  >
                    <PlusIcon />
                    Nueva tarea
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mb-6">
            <SegmentedTabs<ProjectTabKey> tabs={projectTabs} value={activeTab} onChange={setActiveTab} />
            <span className="hidden lg:block text-xs text-[var(--color-text-muted)]">
              {activeTab === "overview" && "Pulso general del proyecto"}
              {activeTab === "board" && "Flujo de trabajo y entregables"}
              {activeTab === "feed" && "Contexto y coordinación del equipo"}
              {activeTab === "leaderboard" && "Contribución y experiencia"}
              {activeTab === "analytics" && "Rendimiento y señales del proyecto"}
            </span>
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
                <div className="space-y-9 animate-fade-in">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-3.5 gap-y-6">
                    <StatTile
                      label="Tareas totales"
                      value={projectTasksList.length}
                      detail={`${projectTasksList.length - completedProjectTasks} pendientes`}
                      tone="brand"
                      icon={<span>▦</span>}
                    />
                    <StatTile
                      label="Completadas"
                      value={completedProjectTasks}
                      detail={`${selectedProjectProgress}% del trabajo`}
                      tone="success"
                      icon={<span>✓</span>}
                    />
                    <StatTile
                      label="Story points"
                      value={projectTasksList.reduce((acc, task) => acc + (task.story_points || 0), 0)}
                      detail="Carga estimada"
                      tone="warning"
                      icon={<span>◇</span>}
                    />
                    <StatTile
                      label="Puntos completados"
                      value={projectTasksList.filter((task) => task.completed).reduce((acc, task) => acc + (task.story_points || 0), 0)}
                      detail="Valor entregado"
                      tone="muted"
                      icon={<span>↗</span>}
                    />
                  </div>

                  <div className="fryd-project-pulse">
                    <div>
                      <p className="fryd-section-label mb-1.5">PULSO DEL PROYECTO</p>
                      <h2 className="text-lg font-semibold tracking-[-0.02em]">{selectedProjectProgress < 35 ? "Construyendo momentum" : selectedProjectProgress < 75 ? "El proyecto está avanzando" : "Entrando en fase de cierre"}</h2>
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        {completedProjectTasks} de {projectTasksList.length || 0} tareas completadas · {projectMembers.length} {projectMembers.length === 1 ? "persona colaborando" : "personas colaborando"}.
                      </p>
                    </div>
                    <div className="w-full sm:w-56">
                      <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-2"><span>Avance</span><span className="text-[var(--color-text-primary)] font-semibold">{selectedProjectProgress}%</span></div>
                      <div className="brand-progress-track h-2.5 rounded-full overflow-hidden"><div className="brand-progress-fill h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, selectedProjectProgress))}%` }} /></div>
                    </div>
                  </div>

                  {/* Adaptive Content depending on methodology */}
                  {selectedProject.methodology === "scrum" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-9">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-9">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-9">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
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
                <div className="space-y-8 animate-fade-in print:space-y-4">
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-9">
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
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-9">
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
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo proyecto"
        description="Define el espacio de trabajo y la metodología que mejor represente cómo quieres avanzar."
        icon={<BriefcaseIcon />}
        footer={
          <>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="create-project-form" className="btn-primary" disabled={loading}>
              <PlusIcon /> {loading ? "Creando..." : "Crear proyecto"}
            </button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={handleCreateProject} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Nombre del proyecto</label>
            <input
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Ej. Rediseño FRYD"
              className="fryd-input"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Descripción <span className="text-[var(--color-text-muted)] font-normal">· opcional</span></label>
            <textarea
              value={projectDescription}
              onChange={(event) => setProjectDescription(event.target.value)}
              placeholder="Objetivo, contexto y entregables principales..."
              className="fryd-input min-h-[96px] resize-none"
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Metodología</label>
            <select value={methodology} onChange={(event) => setMethodology(event.target.value)} className="fryd-input select-styled cursor-pointer">
              <option value="kanban">Kanban · flujo continuo</option>
              <option value="scrum">Scrum · trabajo por sprint</option>
              <option value="waterfall">Waterfall · fases secuenciales</option>
              <option value="lean">Lean · flujo simplificado</option>
              <option value="custom">Personalizada · define tus columnas</option>
            </select>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ["kanban", "Kanban", "Flexible"],
                ["scrum", "Scrum", "Sprints"],
                ["waterfall", "Waterfall", "Fases"],
                ["lean", "Lean", "Ligero"],
              ].map(([key, label, caption]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setMethodology(key)}
                  className={`fryd-method-tile ${methodology === key ? "is-active" : ""}`}
                >
                  <span className="font-semibold">{label}</span>
                  <span>{caption}</span>
                </button>
              ))}
            </div>
          </div>

          {methodology === "custom" && (
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Columnas personalizadas</label>
              <input
                type="text"
                value={customColumns}
                onChange={(event) => setCustomColumns(event.target.value)}
                placeholder="Ideación, Diseño, QA, Desplegado"
                className="fryd-input"
                required
              />
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">Separa cada etapa con una coma.</p>
            </div>
          )}
        </form>
      </Modal>

      {/* --- JOIN PROJECT MODAL --- */}
      <Modal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Unirte a un proyecto"
        description="Introduce el código que te compartió el propietario para añadir el workspace a FRYD."
        icon={<KeyIcon />}
        footer={
          <>
            <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="join-project-form" className="btn-primary" disabled={loading}>{loading ? "Uniéndome..." : "Unirme al proyecto"}</button>
          </>
        }
      >
        <form id="join-project-form" onSubmit={handleJoinProject} className="space-y-4">
          <div className="fryd-panel-subtle p-4">
            <p className="fryd-section-label mb-1">CÓDIGO DE INVITACIÓN</p>
            <p className="text-xs text-[var(--color-text-muted)]">El código identifica el proyecto y permite que FRYD vincule tu usuario como miembro.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Código</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="PROJ-ABCDEF12"
              className="fryd-input font-mono uppercase tracking-[0.08em]"
              required
            />
          </div>
        </form>
      </Modal>

      {/* --- ADD TASK MODAL --- */}
      <Modal
        open={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        title="Nueva tarea de proyecto"
        description={`Añádela a ${taskColumn || "la primera etapa"} y define el esfuerzo, responsable y fecha si aplica.`}
        icon={<PlusIcon />}
        footer={
          <>
            <button type="button" onClick={() => setShowAddTaskModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="project-task-form" className="btn-primary" disabled={loading}>{loading ? "Creando..." : "Crear tarea"}</button>
          </>
        }
      >
        <form id="project-task-form" onSubmit={handleCreateTaskSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Título</label>
            <input type="text" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ej. Diseñar wireframe de landing" className="fryd-input" required />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Descripción</label>
            <textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Contexto, requisitos o criterios de aceptación..." className="fryd-input min-h-[96px] resize-none" rows={4} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Story points</label>
              <input type="number" min="1" max="40" value={taskStoryPoints} onChange={(event) => setTaskStoryPoints(parseInt(event.target.value, 10))} className="fryd-input" required />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Recompensa XP</label>
              <input type="number" min="5" max="200" value={taskXpReward} onChange={(event) => setTaskXpReward(parseInt(event.target.value, 10))} className="fryd-input" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Responsable</label>
              <select value={taskAssignedTo} onChange={(event) => setTaskAssignedTo(event.target.value)} className="fryd-input select-styled cursor-pointer">
                <option value="">Sin asignar</option>
                {projectMembers.map((member) => <option key={member.user_id} value={member.user_id.toString()}>{member.username}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Fecha límite</label>
              <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} className="fryd-input" />
            </div>
          </div>
        </form>
      </Modal>

      {/* --- EDIT TASK MODAL --- */}
      <Modal
        open={showEditTaskModal}
        onClose={() => setShowEditTaskModal(false)}
        title="Editar tarea"
        description="Actualiza el contexto, esfuerzo, etapa o responsable sin perder el historial del proyecto."
        icon={<ClipboardIcon />}
        footer={
          <>
            <button type="button" onClick={() => setShowEditTaskModal(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" form="edit-project-task-form" className="btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</button>
          </>
        }
      >
        <form id="edit-project-task-form" onSubmit={handleEditTaskSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Título</label>
            <input type="text" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} className="fryd-input" required />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Descripción</label>
            <textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} className="fryd-input min-h-[96px] resize-none" rows={4} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Story points</label>
              <input type="number" min="1" max="40" value={taskStoryPoints} onChange={(event) => setTaskStoryPoints(parseInt(event.target.value, 10))} className="fryd-input" required />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Etapa</label>
              <select value={taskColumn} onChange={(event) => setTaskColumn(event.target.value)} className="fryd-input select-styled cursor-pointer">
                {getColumnsList().map((column: string) => <option key={column} value={column}>{column}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Responsable</label>
              <select value={taskAssignedTo} onChange={(event) => setTaskAssignedTo(event.target.value)} className="fryd-input select-styled cursor-pointer">
                <option value="">Sin asignar</option>
                {projectMembers.map((member) => <option key={member.user_id} value={member.user_id.toString()}>{member.username}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Fecha límite</label>
              <input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} className="fryd-input" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
