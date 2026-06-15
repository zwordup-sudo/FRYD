from datetime import date as date_type
from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import Habit, HabitLog
from .schemas import CreateHabitSchema, HabitResponseSchema, UpdateHabitSchema, HabitLogSchema


class HabitService:
    def __init__(self, db: Session, user_id: int | None = None):
        self.db = db
        self.user_id = user_id

    def _to_response(self, habit: Habit) -> HabitResponseSchema:
        return HabitResponseSchema(
            id=habit.id,
            name=habit.name,
            description=habit.description,
            frequency=habit.frequency,
            status=habit.status,
            created_at=habit.created_at,
            updated_at=habit.updated_at,
            logs=[HabitLogSchema.model_validate(log) for log in habit.logs] if habit.logs else []
        )


    def create(self, habit_data: CreateHabitSchema) -> HabitResponseSchema:
        habit = Habit(**habit_data.model_dump(), user_id=self.user_id)
        self.db.add(habit)
        self.db.commit()
        self.db.refresh(habit)
        return self._to_response(habit)

    def get_all(self) -> list[HabitResponseSchema]:
        query = self.db.query(Habit)
        if self.user_id is not None:
            query = query.filter(Habit.user_id == self.user_id)
        habits = query.order_by(Habit.created_at.desc()).all()
        return [self._to_response(habit) for habit in habits]

    def get_by_id(self, habit_id: int) -> HabitResponseSchema:
        habit = self.db.get(Habit, habit_id)
        if not habit or (self.user_id is not None and habit.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Hábito no encontrado")

        return self._to_response(habit)

    def update(self, habit_id: int, habit_data: UpdateHabitSchema) -> HabitResponseSchema:
        habit = self.db.get(Habit, habit_id)
        if not habit or (self.user_id is not None and habit.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Hábito no encontrado")

        for key, value in habit_data.model_dump(exclude_unset=True).items():
            setattr(habit, key, value)

        self.db.commit()
        self.db.refresh(habit)

        return self._to_response(habit)

    def delete(self, habit_id: int) -> None:
        habit = self.db.get(Habit, habit_id)
        if not habit or (self.user_id is not None and habit.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Hábito no encontrado")

        self.db.delete(habit)
        self.db.commit()

    def toggle_log(self, habit_id: int, log_date: date_type) -> HabitResponseSchema:
        habit = self.db.get(Habit, habit_id)
        if not habit or (self.user_id is not None and habit.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Hábito no encontrado")

        log = self.db.query(HabitLog).filter(
            HabitLog.habit_id == habit_id,
            HabitLog.date == log_date
        ).first()

        if log:
            self.db.delete(log)
        else:
            new_log = HabitLog(habit_id=habit_id, date=log_date)
            self.db.add(new_log)

        self.db.commit()
        self.db.refresh(habit)
        return self._to_response(habit)