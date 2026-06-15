from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import Task
from .schemas import CreateTaskSchema, TaskResponseSchema, UpdateTaskSchema


class TaskService:
    def __init__(self, db: Session, user_id: int | None = None):
        self.db = db
        self.user_id = user_id

    def _to_response(self, task: Task) -> TaskResponseSchema:
        return TaskResponseSchema(
            id=task.id,
            title=task.title,
            description=task.description,
            due_date=task.due_date,
            status=task.status,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )

    def create(self, task_data: CreateTaskSchema) -> TaskResponseSchema:
        task = Task(**task_data.model_dump(), user_id=self.user_id)
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return self._to_response(task)

    def get_all(self) -> list[TaskResponseSchema]:
        query = self.db.query(Task)
        if self.user_id is not None:
            query = query.filter(Task.user_id == self.user_id)
        tasks = query.order_by(Task.due_date.asc()).all()
        return [self._to_response(task) for task in tasks]

    def get_by_id(self, task_id: int) -> TaskResponseSchema:
        task = self.db.get(Task, task_id)
        if not task or (self.user_id is not None and task.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Tarea no encontrada")

        return self._to_response(task)

    def update(self, task_id: int, task_data: UpdateTaskSchema) -> TaskResponseSchema:
        task = self.db.get(Task, task_id)
        if not task or (self.user_id is not None and task.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Tarea no encontrada")

        for key, value in task_data.model_dump(exclude_unset=True).items():
            setattr(task, key, value)

        self.db.commit()
        self.db.refresh(task)

        return self._to_response(task)

    def delete(self, task_id: int) -> None:
        task = self.db.get(Task, task_id)
        if not task or (self.user_id is not None and task.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Tarea no encontrada")

        self.db.delete(task)
        self.db.commit()