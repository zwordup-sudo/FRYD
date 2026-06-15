from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class MoodTrendPoint(BaseModel):
    date: str
    mood: str
    energy_level: int


class TaskProductivityPoint(BaseModel):
    week_label: str
    completed: int
    created: int


class HabitConsistencyItem(BaseModel):
    name: str
    completion_rate: float
    total_days: int
    completed_days: int


class CorrelationPoint(BaseModel):
    date: str
    energy: Optional[int] = None
    habits_completed: int
    tasks_completed: int


class AnalyticsSummaryResponse(BaseModel):
    # Summary metrics
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    total_habits: int
    active_habits: int
    total_entries: int
    avg_energy: float
    most_common_mood: str
    current_streak: int

    # Chart data
    mood_trend: list[MoodTrendPoint]
    task_productivity: list[TaskProductivityPoint]
    habit_consistency: list[HabitConsistencyItem]
    daily_correlation: list[CorrelationPoint]
