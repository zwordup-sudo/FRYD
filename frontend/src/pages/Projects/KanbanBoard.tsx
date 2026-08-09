import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  column_name: string;
  assigned_to: number | null;
  assignee_username: string | null;
  story_points: number;
  xp_reward: number;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
}

interface Member {
  user_id: number;
  username: string;
  role: string;
  points_earned: number;
}

interface KanbanBoardProps {
  columns: string[];
  tasks: Task[];
  members: Member[];
  onMoveTask: (taskId: number, newColumn: string) => Promise<void>;
  onEditTask: (task: Task) => void;
  onAddTask: (column: string) => void;
  onCompleteTask: (taskId: number) => Promise<void>;
}

export default function KanbanBoard({
  columns,
  tasks,
  onMoveTask,
  onEditTask,
  onAddTask,
  onCompleteTask,
}: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onMoveTask(parseInt(draggableId, 10), destination.droppableId);
  };

  const getInitials = (name: string) => (name ? name.substring(0, 2).toUpperCase() : "?");

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

  const isOverdue = (task: Task) =>
    Boolean(task.due_date && !task.completed && new Date(task.due_date).getTime() < Date.now());

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-5 min-h-[520px] snap-x snap-mandatory">
        {columns.map((columnName, columnIndex) => {
          const columnTasks = tasks.filter((task) => task.column_name === columnName);
          const completedCount = columnTasks.filter((task) => task.completed).length;

          return (
            <section key={columnName} className="fryd-kanban-column snap-start">
              <header className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="fryd-kanban-column-dot" data-index={columnIndex % 4} />
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{columnName}</h3>
                    <span className="fryd-kanban-count">{columnTasks.length}</span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 pl-4">
                    {completedCount > 0 ? `${completedCount} completada${completedCount === 1 ? "" : "s"}` : "Sin tareas completadas aquí"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddTask(columnName)}
                  className="btn-ghost p-1.5 flex-shrink-0"
                  title={`Añadir tarea a ${columnName}`}
                  aria-label={`Añadir tarea a ${columnName}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </header>

              <Droppable droppableId={columnName}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`fryd-kanban-dropzone ${snapshot.isDraggingOver ? "is-dragging-over" : ""}`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <article
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                            className={`fryd-kanban-task ${task.completed ? "is-complete" : ""} ${snapshot.isDragging ? "is-dragging" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="badge badge-purple text-[9px]">{task.story_points} SP</span>
                                <span className="badge badge-blue text-[9px]">+{task.xp_reward} XP</span>
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onEditTask(task);
                                }}
                                className="btn-ghost p-1.5 -mr-1 -mt-1"
                                title="Editar tarea"
                                aria-label={`Editar ${task.title}`}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                              </button>
                            </div>

                            <h4 className={`text-sm font-semibold leading-snug ${task.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]"}`}>
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-2 mt-1.5">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
                              <span className={`inline-flex items-center gap-1.5 text-[10px] ${isOverdue(task) ? "text-[var(--color-accent-danger)]" : "text-[var(--color-text-muted)]"}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                                {task.due_date ? `${isOverdue(task) ? "Vencida" : "Vence"} ${formatDate(task.due_date)}` : "Sin fecha"}
                              </span>

                              <div className="flex items-center gap-2">
                                {task.assignee_username && (
                                  <div className="fryd-assignee-avatar" title={`Asignada a ${task.assignee_username}`}>
                                    {getInitials(task.assignee_username)}
                                  </div>
                                )}
                                {!task.completed && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onCompleteTask(task.id);
                                    }}
                                    className="fryd-complete-task"
                                    title="Marcar como completada"
                                    aria-label={`Completar ${task.title}`}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </article>
                        )}
                      </Draggable>
                    ))}
                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <button type="button" onClick={() => onAddTask(columnName)} className="fryd-kanban-empty">
                        <span>＋</span>
                        <span>Añadir primera tarea</span>
                      </button>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}
