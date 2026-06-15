from collections import Counter
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.tasks.models import Task
from app.habits.models import Habit, HabitLog
from app.diary.models import Entry

from .schemas import (
    AnalyticsSummaryResponse,
    CorrelationPoint,
    HabitConsistencyItem,
    MoodTrendPoint,
    TaskProductivityPoint,
)


class AnalyticsService:
    def __init__(self, db: Session, user_id: int | None = None):
        self.db = db
        self.user_id = user_id

    def get_summary(self) -> AnalyticsSummaryResponse:
        """Generate a comprehensive analytics summary for the user."""
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)
        fourteen_days_ago = today - timedelta(days=14)

        # ── Fetch all data ──────────────────────────────────────────
        tasks_query = self.db.query(Task)
        habits_query = self.db.query(Habit)
        entries_query = self.db.query(Entry)

        if self.user_id is not None:
            tasks_query = tasks_query.filter(Task.user_id == self.user_id)
            habits_query = habits_query.filter(Habit.user_id == self.user_id)
            entries_query = entries_query.filter(Entry.user_id == self.user_id)

        all_tasks = tasks_query.all()
        all_habits = habits_query.all()
        all_entries = entries_query.order_by(Entry.created_at.desc()).all()

        # ── Summary Metrics ─────────────────────────────────────────
        completed_tasks = [t for t in all_tasks if t.status == "completed"]
        pending_tasks = [t for t in all_tasks if t.status != "completed"]
        active_habits = [h for h in all_habits if h.status == "active"]

        # Average energy
        energy_values = [e.energy_level for e in all_entries if e.energy_level is not None]
        avg_energy = round(sum(energy_values) / len(energy_values), 1) if energy_values else 0.0

        # Most common mood
        moods = [e.mood for e in all_entries if e.mood]
        most_common_mood = Counter(moods).most_common(1)[0][0] if moods else "neutral"

        # Current streak (consecutive diary days)
        current_streak = self._calculate_streak(all_entries)

        # ── Mood Trend (last 30 days) ───────────────────────────────
        mood_trend = self._get_mood_trend(all_entries, thirty_days_ago, today)

        # ── Task Productivity (last 4 weeks) ────────────────────────
        task_productivity = self._get_task_productivity(all_tasks)

        # ── Habit Consistency (active habits, last 30 days) ─────────
        habit_consistency = self._get_habit_consistency(active_habits, thirty_days_ago, today)

        # ── Daily Correlation (last 14 days) ────────────────────────
        daily_correlation = self._get_daily_correlation(
            all_entries, all_tasks, active_habits, fourteen_days_ago, today
        )

        return AnalyticsSummaryResponse(
            total_tasks=len(all_tasks),
            completed_tasks=len(completed_tasks),
            pending_tasks=len(pending_tasks),
            total_habits=len(all_habits),
            active_habits=len(active_habits),
            total_entries=len(all_entries),
            avg_energy=avg_energy,
            most_common_mood=most_common_mood,
            current_streak=current_streak,
            mood_trend=mood_trend,
            task_productivity=task_productivity,
            habit_consistency=habit_consistency,
            daily_correlation=daily_correlation,
        )

    # ── Private Helpers ─────────────────────────────────────────────

    def _calculate_streak(self, entries: list) -> int:
        """Calculate consecutive diary entry streak."""
        if not entries:
            return 0

        entry_dates = sorted(
            set(e.created_at.date() for e in entries if e.created_at),
            reverse=True,
        )
        if not entry_dates:
            return 0

        today = date.today()
        yesterday = today - timedelta(days=1)

        if entry_dates[0] != today and entry_dates[0] != yesterday:
            return 0

        streak = 0
        expected = entry_dates[0]
        for d in entry_dates:
            if d == expected:
                streak += 1
                expected = d - timedelta(days=1)
            elif d < expected:
                break

        return streak

    def _get_mood_trend(self, entries: list, start: date, end: date) -> list[MoodTrendPoint]:
        """Get mood and energy data points for the last 30 days."""
        # Build a map of date -> entry (most recent per day)
        entry_by_date: dict[str, Entry] = {}
        for e in entries:
            if e.created_at:
                d = e.created_at.date()
                if start <= d <= end:
                    date_str = d.isoformat()
                    if date_str not in entry_by_date:
                        entry_by_date[date_str] = e

        # Generate data for each day
        result = []
        current = start
        while current <= end:
            date_str = current.isoformat()
            if date_str in entry_by_date:
                entry = entry_by_date[date_str]
                result.append(MoodTrendPoint(
                    date=date_str,
                    mood=entry.mood or "neutral",
                    energy_level=entry.energy_level or 3,
                ))
            current += timedelta(days=1)

        return result

    def _get_task_productivity(self, tasks: list) -> list[TaskProductivityPoint]:
        """Get tasks created vs completed by week for last 4 weeks."""
        today = date.today()
        result = []

        for week_offset in range(3, -1, -1):
            week_start = today - timedelta(days=today.weekday() + 7 * week_offset)
            week_end = week_start + timedelta(days=6)

            created_count = 0
            completed_count = 0

            for task in tasks:
                task_created = task.created_at.date() if task.created_at else None
                task_updated = task.updated_at.date() if task.updated_at else None

                if task_created and week_start <= task_created <= week_end:
                    created_count += 1

                if (
                    task.status == "completed"
                    and task_updated
                    and week_start <= task_updated <= week_end
                ):
                    completed_count += 1

            label = f"{week_start.strftime('%d/%m')} - {week_end.strftime('%d/%m')}"
            result.append(TaskProductivityPoint(
                week_label=label,
                completed=completed_count,
                created=created_count,
            ))

        return result

    def _get_habit_consistency(
        self, active_habits: list, start: date, end: date
    ) -> list[HabitConsistencyItem]:
        """Calculate completion rate per active habit over the period."""
        total_days = (end - start).days + 1
        result = []

        for habit in active_habits:
            # Count logs within the period
            logs_in_period = [
                log for log in (habit.logs or [])
                if log.date and start <= log.date <= end
            ]
            completed_days = len(logs_in_period)

            # Use habit creation date if it's within the period
            habit_start = habit.created_at.date() if habit.created_at else start
            effective_days = min(total_days, (end - max(start, habit_start)).days + 1)
            effective_days = max(effective_days, 1)  # Avoid division by zero

            rate = round((completed_days / effective_days) * 100, 1)

            result.append(HabitConsistencyItem(
                name=habit.name,
                completion_rate=min(rate, 100.0),
                total_days=effective_days,
                completed_days=completed_days,
            ))

        # Sort by completion rate descending
        result.sort(key=lambda x: x.completion_rate, reverse=True)
        return result

    def _get_daily_correlation(
        self,
        entries: list,
        tasks: list,
        active_habits: list,
        start: date,
        end: date,
    ) -> list[CorrelationPoint]:
        """Cross-reference energy, habits completed, and tasks completed per day."""
        # Build maps
        energy_by_date: dict[str, int] = {}
        for e in entries:
            if e.created_at:
                d_str = e.created_at.date().isoformat()
                if d_str not in energy_by_date and e.energy_level is not None:
                    energy_by_date[d_str] = e.energy_level

        # Habit logs by date
        habit_logs_by_date: dict[str, int] = {}
        for habit in active_habits:
            for log in (habit.logs or []):
                if log.date:
                    d_str = log.date.isoformat()
                    habit_logs_by_date[d_str] = habit_logs_by_date.get(d_str, 0) + 1

        # Tasks completed by date (using updated_at as completion date)
        tasks_by_date: dict[str, int] = {}
        for t in tasks:
            if t.status == "completed" and t.updated_at:
                d_str = t.updated_at.date().isoformat()
                tasks_by_date[d_str] = tasks_by_date.get(d_str, 0) + 1

        # Generate points
        result = []
        current = start
        while current <= end:
            d_str = current.isoformat()
            result.append(CorrelationPoint(
                date=d_str,
                energy=energy_by_date.get(d_str),
                habits_completed=habit_logs_by_date.get(d_str, 0),
                tasks_completed=tasks_by_date.get(d_str, 0),
            ))
            current += timedelta(days=1)

        return result
