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
  members: _members,
  onMoveTask,
  onEditTask,
  onAddTask,
  onCompleteTask,
}: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId, 10);
    const newColumn = destination.droppableId;
    
    onMoveTask(taskId, newColumn);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-5 overflow-x-auto pb-4 min-h-[500px]">
        {columns.map((columnName) => {
          const columnTasks = tasks.filter((t) => t.column_name === columnName);

          return (
            <div
              key={columnName}
              className="flex flex-col w-72 flex-shrink-0 rounded-2xl bg-white/[0.02] border border-[var(--color-border-default)] p-4 shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {columnName}
                  </span>
                  <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-white/[0.06] text-[var(--color-text-muted)]">
                    {columnTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask(columnName)}
                  className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
                  title="Añadir tarea"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={columnName}>
                {(provided, snapshot) => {
                  return (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 flex flex-col gap-3 min-h-[400px] rounded-xl transition-colors ${
                        snapshot.isDraggingOver ? "bg-white/[0.01]" : ""
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable
                          key={task.id.toString()}
                          draggableId={task.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => {
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                                className={`p-4 rounded-xl border bg-[var(--color-surface-card)] hover:border-white/10 hover:shadow-md transition-all ${
                                  snapshot.isDragging
                                    ? "border-[var(--color-accent-primary)] shadow-lg rotate-1 scale-[1.02]"
                                    : task.completed
                                    ? "border-emerald-500/20 bg-emerald-500/[0.01]"
                                    : "border-[var(--color-border-default)]"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                      task.completed
                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                        : "bg-white/[0.04] text-[var(--color-text-secondary)] border-[var(--color-border-default)]"
                                    }`}
                                  >
                                    {task.story_points} SP
                                  </span>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                      +{task.xp_reward} XP
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditTask(task);
                                      }}
                                      className="p-1 rounded hover:bg-white/[0.04] text-[var(--color-text-muted)] hover:text-white cursor-pointer"
                                      title="Editar tarea"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                <h4 className={`text-sm font-semibold mb-1 line-clamp-2 ${task.completed ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]"}`}>
                                  {task.title}
                                </h4>

                                {task.description && (
                                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-3">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
                                  <span className="text-[9px] text-[var(--color-text-muted)]">
                                    {task.due_date
                                      ? `Vence: ${new Date(task.due_date).toLocaleDateString()}`
                                      : "Sin fecha limite"}
                                  </span>

                                  <div className="flex items-center gap-2">
                                    {task.assignee_username && (
                                      <div
                                        className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[9px] font-extrabold text-white cursor-help"
                                        title={`Asignada a ${task.assignee_username}`}
                                      >
                                        {getInitials(task.assignee_username)}
                                      </div>
                                    )}

                                    {!task.completed && (
                                      <button
                                        onClick={() => onCompleteTask(task.id)}
                                        className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                                        title="Marcar completada"
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                          <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  );
                }}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
