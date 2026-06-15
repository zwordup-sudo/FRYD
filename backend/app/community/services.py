import secrets
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.users.models import User
from .models import Club, ClubMember, ClubTask, ClubTaskCompletion, ClubFeedMessage
from .schemas import ClubCreate, ClubTaskCreate, ClubFeedMessageCreate

class CommunityService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def _get_user_name(self, user_id: int) -> str:
        user = self.db.query(User).filter(User.id == user_id).first()
        return user.username if user else "Usuario"

    def _check_membership(self, club_id: int) -> ClubMember:
        member = (
            self.db.query(ClubMember)
            .filter(ClubMember.club_id == club_id, ClubMember.user_id == self.user_id)
            .first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este club. Debes unirte primero."
            )
        return member

    # --- Clubs ---

    def create_club(self, data: ClubCreate) -> Club:
        # Generate a unique invite code
        invite_code = secrets.token_hex(4).upper()  # 8 character code
        
        club = Club(
            name=data.name,
            description=data.description,
            invite_code=invite_code,
            owner_id=self.user_id
        )
        self.db.add(club)
        self.db.commit()
        self.db.refresh(club)

        # Register creator as owner member
        member = ClubMember(
            club_id=club.id,
            user_id=self.user_id,
            role="owner",
            points_earned=0
        )
        self.db.add(member)
        
        # Post initial feed message
        username = self._get_user_name(self.user_id)
        welcome_message = ClubFeedMessage(
            club_id=club.id,
            user_id=self.user_id,
            content=f"🎉 ¡El club '{club.name}' ha sido creado por {username}! ¡Bienvenidos!",
            is_achievement=True
        )
        self.db.add(welcome_message)
        
        self.db.commit()
        self.db.refresh(club)
        return club

    def join_club(self, invite_code: str) -> Club:
        club = self.db.query(Club).filter(Club.invite_code == invite_code.upper()).first()
        if not club:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Código de invitación no válido o club no encontrado."
            )

        # Check if already a member
        existing = (
            self.db.query(ClubMember)
            .filter(ClubMember.club_id == club.id, ClubMember.user_id == self.user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya eres miembro de este club."
            )

        # Create member
        member = ClubMember(
            club_id=club.id,
            user_id=self.user_id,
            role="member",
            points_earned=0
        )
        self.db.add(member)

        # Feed alert
        username = self._get_user_name(self.user_id)
        alert = ClubFeedMessage(
            club_id=club.id,
            user_id=self.user_id,
            content=f"👋 ¡{username} se ha unido al club! ¡Démosle la bienvenida!",
            is_achievement=True
        )
        self.db.add(alert)
        
        self.db.commit()
        self.db.refresh(club)
        return club

    def get_my_clubs(self) -> list[dict]:
        memberships = (
            self.db.query(ClubMember)
            .filter(ClubMember.user_id == self.user_id)
            .all()
        )
        clubs_data = []
        for m in memberships:
            club = m.club
            # Calculate general progress in tasks
            total_tasks = self.db.query(ClubTask).filter(ClubTask.club_id == club.id).count()
            completed_tasks = (
                self.db.query(ClubTaskCompletion)
                .join(ClubTask)
                .filter(ClubTask.club_id == club.id, ClubTaskCompletion.user_id == self.user_id)
                .count()
            )
            progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            clubs_data.append({
                "id": club.id,
                "name": club.name,
                "description": club.description,
                "invite_code": club.invite_code,
                "owner_id": club.owner_id,
                "created_at": club.created_at,
                "role": m.role,
                "points_earned": m.points_earned,
                "task_progress": round(progress, 1)
            })
        return clubs_data

    def get_club_details(self, club_id: int) -> dict:
        club = self.db.get(Club, club_id)
        if not club:
            raise HTTPException(status_code=404, detail="Club no encontrado.")
        member = self._check_membership(club_id)
        
        return {
            "id": club.id,
            "name": club.name,
            "description": club.description,
            "invite_code": club.invite_code,
            "owner_id": club.owner_id,
            "created_at": club.created_at,
            "my_role": member.role,
            "my_points": member.points_earned
        }

    # --- Leaderboard ---

    def get_leaderboard(self, club_id: int) -> list[dict]:
        self._check_membership(club_id)
        members = (
            self.db.query(ClubMember)
            .filter(ClubMember.club_id == club_id)
            .order_by(ClubMember.points_earned.desc())
            .all()
        )
        
        leaderboard = []
        for m in members:
            username = self._get_user_name(m.user_id)
            leaderboard.append({
                "user_id": m.user_id,
                "username": username,
                "role": m.role,
                "points_earned": m.points_earned,
                "joined_at": m.joined_at
            })
        return leaderboard

    # --- Tasks ---

    def create_club_task(self, club_id: int, data: ClubTaskCreate) -> ClubTask:
        member = self._check_membership(club_id)
        if member.role != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el administrador del club puede asignar tareas."
            )

        task = ClubTask(
            club_id=club_id,
            title=data.title,
            description=data.description,
            task_type=data.task_type,
            xp_reward=data.xp_reward,
            due_date=data.due_date
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)

        # Notify feed
        type_labels = {"individual": "Individual", "collaborative": "Colaborativa", "competitive": "Carrera 🏁"}
        task_type_label = type_labels.get(data.task_type, data.task_type)
        alert = ClubFeedMessage(
            club_id=club_id,
            user_id=self.user_id,
            content=f"🎯 Nueva tarea asignada al club: **{task.title}** ({task_type_label}) | Recompensa: +{task.xp_reward} XP",
            is_achievement=True
        )
        self.db.add(alert)
        self.db.commit()
        
        return task

    def get_club_tasks(self, club_id: int) -> list[dict]:
        self._check_membership(club_id)
        tasks = self.db.query(ClubTask).filter(ClubTask.club_id == club_id).all()
        
        result = []
        for t in tasks:
            is_completed = (
                self.db.query(ClubTaskCompletion)
                .filter(ClubTaskCompletion.club_task_id == t.id, ClubTaskCompletion.user_id == self.user_id)
                .first()
            ) is not None
            
            # Additional metadata for competitive tasks: who completed it first
            completed_by = None
            if t.task_type == "competitive":
                first_completion = (
                    self.db.query(ClubTaskCompletion)
                    .filter(ClubTaskCompletion.club_task_id == t.id)
                    .order_by(ClubTaskCompletion.completed_at.asc())
                    .first()
                )
                if first_completion:
                    completed_by = self._get_user_name(first_completion.user_id)

            result.append({
                "id": t.id,
                "club_id": t.club_id,
                "title": t.title,
                "description": t.description,
                "task_type": t.task_type,
                "xp_reward": t.xp_reward,
                "due_date": t.due_date,
                "created_at": t.created_at,
                "is_completed": is_completed,
                "completed_by": completed_by
            })
        return result

    def complete_club_task(self, task_id: int) -> ClubTaskCompletion:
        task = self.db.get(ClubTask, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Tarea de club no encontrada.")
        
        member = self._check_membership(task.club_id)

        # Check if already completed by this user
        existing = (
            self.db.query(ClubTaskCompletion)
            .filter(ClubTaskCompletion.club_task_id == task_id, ClubTaskCompletion.user_id == self.user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya has completado esta tarea."
            )

        # Check competitive restriction
        if task.task_type == "competitive":
            first_completion = (
                self.db.query(ClubTaskCompletion)
                .filter(ClubTaskCompletion.club_task_id == task_id)
                .first()
            )
            if first_completion:
                winner = self._get_user_name(first_completion.user_id)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Esta carrera ya ha terminado. La completó primero: {winner}"
                )

        # Create completion record
        completion = ClubTaskCompletion(
            club_task_id=task_id,
            user_id=self.user_id
        )
        self.db.add(completion)

        # Award points
        member.points_earned += task.xp_reward

        # Feed alert
        username = self._get_user_name(self.user_id)
        if task.task_type == "competitive":
            msg_content = f"🏆 ¡{username} ganó la carrera y completó la tarea competitiva: **{task.title}**! (+{task.xp_reward} XP)"
        elif task.task_type == "collaborative":
            msg_content = f"🤝 {username} aportó al club completando la tarea colaborativa: **{task.title}** (+{task.xp_reward} XP)"
        else:
            msg_content = f"✅ {username} completó la tarea individual: **{task.title}** (+{task.xp_reward} XP)"

        alert = ClubFeedMessage(
            club_id=task.club_id,
            user_id=self.user_id,
            content=msg_content,
            is_achievement=True
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(completion)
        
        return completion

    # --- Feed Messages ---

    def get_feed_messages(self, club_id: int) -> list[dict]:
        self._check_membership(club_id)
        messages = (
            self.db.query(ClubFeedMessage)
            .filter(ClubFeedMessage.club_id == club_id)
            .order_by(ClubFeedMessage.created_at.desc())
            .limit(50)
            .all()
        )
        
        result = []
        for msg in messages:
            result.append({
                "id": msg.id,
                "club_id": msg.club_id,
                "user_id": msg.user_id,
                "username": self._get_user_name(msg.user_id),
                "content": msg.content,
                "is_achievement": msg.is_achievement,
                "created_at": msg.created_at
            })
        return result

    def post_feed_message(self, club_id: int, data: ClubFeedMessageCreate) -> ClubFeedMessage:
        self._check_membership(club_id)
        
        msg = ClubFeedMessage(
            club_id=club_id,
            user_id=self.user_id,
            content=data.content,
            is_achievement=False
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        
        return msg
