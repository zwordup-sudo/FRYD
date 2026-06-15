from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.users.security import get_current_user
from app.users.models import User
from .schemas import (
    ProjectCreate,
    ProjectRead,
    ProjectJoinRequest,
    ProjectMemberRead,
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectTaskRead,
    ProjectFeedMessageCreate,
    ProjectFeedMessageRead,
)
from .services import ProjectService

router = APIRouter()

# --- Projects ---

@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    request: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new collaborative project with a methodology."""
    service = ProjectService(db, user_id=current_user.id)
    return service.create_project(request)


@router.post("/join", response_model=ProjectRead, status_code=status.HTTP_200_OK)
def join_project(
    request: ProjectJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a collaborative project using an invite code."""
    service = ProjectService(db, user_id=current_user.id)
    return service.join_project(request.invite_code)


@router.get("/", status_code=status.HTTP_200_OK)
def list_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all projects the current user is a member of."""
    service = ProjectService(db, user_id=current_user.id)
    return service.get_my_projects()


@router.get("/{project_id}", status_code=status.HTTP_200_OK)
def get_project_details(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific project."""
    service = ProjectService(db, user_id=current_user.id)
    return service.get_project_details(project_id)


# --- Leaderboard ---

@router.get("/{project_id}/leaderboard", response_model=list[ProjectMemberRead], status_code=status.HTTP_200_OK)
def get_project_leaderboard(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the leaderboard/rankings of a specific project."""
    service = ProjectService(db, user_id=current_user.id)
    return service.get_leaderboard(project_id)


# --- Tasks ---

@router.post("/{project_id}/tasks", response_model=ProjectTaskRead, status_code=status.HTTP_201_CREATED)
def create_project_task(
    project_id: int,
    request: ProjectTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a task in a project."""
    service = ProjectService(db, user_id=current_user.id)
    return service.create_project_task(project_id, request)


@router.patch("/tasks/{task_id}", response_model=ProjectTaskRead, status_code=status.HTTP_200_OK)
def update_project_task(
    task_id: int,
    request: ProjectTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a project task (moves columns, reassigns, etc.)."""
    service = ProjectService(db, user_id=current_user.id)
    return service.update_project_task(task_id, request)


@router.get("/{project_id}/tasks", response_model=list[ProjectTaskRead], status_code=status.HTTP_200_OK)
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks for a specific project."""
    service = ProjectService(db, user_id=current_user.id)
    return service.get_project_tasks(project_id)


@router.post("/tasks/{task_id}/complete", status_code=status.HTTP_200_OK)
def complete_project_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a task as completed (moves to last column, awards XP)."""
    service = ProjectService(db, user_id=current_user.id)
    return service.complete_project_task(task_id)


# --- Feed Messages ---

@router.get("/{project_id}/feed", response_model=list[ProjectFeedMessageRead], status_code=status.HTTP_200_OK)
def get_project_feed(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get project wall feed messages."""
    service = ProjectService(db, user_id=current_user.id)
    return service.get_feed_messages(project_id)


@router.post("/{project_id}/feed", response_model=ProjectFeedMessageRead, status_code=status.HTTP_201_CREATED)
def post_feed_message(
    project_id: int,
    request: ProjectFeedMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Post a manual message on the project feed wall."""
    service = ProjectService(db, user_id=current_user.id)
    msg = service.post_feed_message(project_id, request)
    
    return ProjectFeedMessageRead(
        id=msg.id,
        project_id=msg.project_id,
        user_id=msg.user_id,
        username=current_user.username,
        content=msg.content,
        is_achievement=msg.is_achievement,
        created_at=msg.created_at
    )


# --- Analytics & AI Coach ---

@router.get("/{project_id}/analytics", status_code=status.HTTP_200_OK)
def get_project_analytics(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get statistics, KPIs and productivity metrics for a project."""
    service = ProjectService(db, user_id=current_user.id)
    return service.get_project_analytics(project_id)


@router.post("/{project_id}/ai-coach", status_code=status.HTTP_200_OK)
async def get_project_ai_coach(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate AI-powered project diagnosis and action plan."""
    service = ProjectService(db, user_id=current_user.id)
    return await service.get_project_ai_coach(project_id, current_user)

