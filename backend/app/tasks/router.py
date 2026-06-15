from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.users.security import get_current_user
from app.users.models import User

from .schemas import CreateTaskSchema, TaskResponseSchema, UpdateTaskSchema
from .services import TaskService

router = APIRouter()


@router.post("/", response_model=TaskResponseSchema, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: CreateTaskSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TaskService(db, user_id=current_user.id)
    return service.create(task_data)


@router.get("/", response_model=list[TaskResponseSchema], status_code=status.HTTP_200_OK)
def list_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TaskService(db, user_id=current_user.id)
    return service.get_all()


@router.get("/{task_id}", response_model=TaskResponseSchema, status_code=status.HTTP_200_OK)
def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TaskService(db, user_id=current_user.id)
    return service.get_by_id(task_id)


@router.patch("/{task_id}", response_model=TaskResponseSchema, status_code=status.HTTP_200_OK)
def update_task(
    task_id: int,
    task_data: UpdateTaskSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TaskService(db, user_id=current_user.id)
    return service.update(task_id, task_data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TaskService(db, user_id=current_user.id)
    service.delete(task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)