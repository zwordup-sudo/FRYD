from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.users.security import get_current_user
from app.users.models import User

from .schemas import CreateHabitSchema, HabitResponseSchema, UpdateHabitSchema, HabitLogToggleSchema
from .services import HabitService

router = APIRouter()


@router.post("/", response_model=HabitResponseSchema, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_data: CreateHabitSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = HabitService(db, user_id=current_user.id)
    return service.create(habit_data)


@router.get("/", response_model=list[HabitResponseSchema], status_code=status.HTTP_200_OK)
def list_habits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = HabitService(db, user_id=current_user.id)
    return service.get_all()


@router.get("/{habit_id}", response_model=HabitResponseSchema, status_code=status.HTTP_200_OK)
def get_habit_by_id(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = HabitService(db, user_id=current_user.id)
    return service.get_by_id(habit_id)


@router.patch("/{habit_id}", response_model=HabitResponseSchema, status_code=status.HTTP_200_OK)
def update_habit(
    habit_id: int,
    habit_data: UpdateHabitSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = HabitService(db, user_id=current_user.id)
    return service.update(habit_id, habit_data)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = HabitService(db, user_id=current_user.id)
    service.delete(habit_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{habit_id}/toggle-log", response_model=HabitResponseSchema, status_code=status.HTTP_200_OK)
def toggle_habit_log(
    habit_id: int,
    payload: HabitLogToggleSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = HabitService(db, user_id=current_user.id)
    return service.toggle_log(habit_id, payload.date)