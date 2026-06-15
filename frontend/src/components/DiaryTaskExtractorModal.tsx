import { useState } from "react";
import { createTask } from "../services/api";

interface ExtractedTask {
  title: string;
  description: string;
  due_date: string | null;
}

interface DiaryTaskExtractorModalProps {
  tasks: ExtractedTask[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function DiaryTaskExtractorModal({
  tasks: initialTasks,
  onClose,
  onSuccess,
  onError,
}: DiaryTaskExtractorModalProps) {
  // Setup tasks with a selection state and formatted/defaulted due dates
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().substring(0, 16); // format: YYYY-MM-DDTHH:MM
  };

  const [tasks, setTasks] = useState(
    initialTasks.map((t, index) => {
      let formattedDate = getDefaultDate();
      if (t.due_date) {
        try {
          const parsed = new Date(t.due_date);
          if (parsed > new Date()) {
            formattedDate = parsed.toISOString().substring(0, 16);
          }
        } catch {}
      }
      return {
        id: index,
        title: t.title,
        description: t.description || "",
        due_date: formattedDate,
        selected: true,
      };
    })
  );

  const [loading, setLoading] = useState(false);

  const handleToggleSelect = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)));
  };

  const handleChangeField = (id: number, field: string, value: any) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleConfirm = async () => {
    const selectedTasks = tasks.filter((t) => t.selected);
    if (selectedTasks.length === 0) {
      onClose();
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      for (const t of selectedTasks) {
        // Prepare task schema matching CreateTaskSchema
        const payload = {
          title: t.title.trim(),
          description: t.description.trim() || null,
          due_date: new Date(t.due_date).toISOString(),
          status: "pending",
        };
        await createTask(payload);
      }
      onSuccess(`¡Se crearon ${selectedTasks.length} tareas exitosamente!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      onError("Error al crear algunas tareas. Verifica las fechas límites.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content card-static w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              ✨ Tareas Detectadas por IA
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              La IA ha detectado posibles tareas en tu entrada de diario. Selecciona y edita las que desees agregar a tu lista de tareas.
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1 cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 mb-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                task.selected
                  ? "bg-[var(--color-accent-primary-glow)] border-[var(--color-accent-primary)]/30"
                  : "bg-white/[0.01] border-[var(--color-border-default)] opacity-60"
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={task.selected}
                onChange={() => handleToggleSelect(task.id)}
                className="mt-1 h-4.5 w-4.5 rounded border-white/20 bg-white/5 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] cursor-pointer"
              />

              {/* Editable Fields */}
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleChangeField(task.id, "title", e.target.value)}
                  disabled={!task.selected}
                  placeholder="Título de la tarea"
                  className="fryd-input font-semibold text-sm py-1.5"
                />

                <textarea
                  value={task.description}
                  onChange={(e) => handleChangeField(task.id, "description", e.target.value)}
                  disabled={!task.selected}
                  placeholder="Descripción de la tarea (opcional)"
                  className="fryd-input text-xs py-1.5 min-h-[50px] resize-none"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">
                    Fecha límite:
                  </span>
                  <input
                    type="datetime-local"
                    value={task.due_date}
                    onChange={(e) => handleChangeField(task.id, "due_date", e.target.value)}
                    disabled={!task.selected}
                    className="fryd-input text-xs py-1 px-2 w-auto max-w-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary cursor-pointer"
            disabled={loading}
          >
            Ignorar tareas
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary cursor-pointer"
            disabled={loading || tasks.filter((t) => t.selected).length === 0}
          >
            {loading ? "Creando..." : "Confirmar y Crear Tareas"}
          </button>
        </div>
      </div>
    </div>
  );
}
