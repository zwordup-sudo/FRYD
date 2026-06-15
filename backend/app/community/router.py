from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.users.security import get_current_user
from app.users.models import User
from .schemas import (
    ClubCreate,
    ClubRead,
    ClubJoinRequest,
    ClubMemberRead,
    ClubTaskCreate,
    ClubTaskRead,
    ClubFeedMessageCreate,
    ClubFeedMessageRead,
)
from .services import CommunityService

router = APIRouter()

# --- Clubs ---

@router.post("/clubs", response_model=ClubRead, status_code=status.HTTP_201_CREATED)
def create_club(
    request: ClubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new club."""
    service = CommunityService(db, user_id=current_user.id)
    return service.create_club(request)


@router.post("/clubs/join", response_model=ClubRead, status_code=status.HTTP_200_OK)
def join_club(
    request: ClubJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a club using an invite code."""
    service = CommunityService(db, user_id=current_user.id)
    return service.join_club(request.invite_code)


@router.get("/clubs", status_code=status.HTTP_200_OK)
def list_my_clubs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all clubs the current user is a member of."""
    service = CommunityService(db, user_id=current_user.id)
    return service.get_my_clubs()


@router.get("/clubs/{club_id}", status_code=status.HTTP_200_OK)
def get_club_details(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific club."""
    service = CommunityService(db, user_id=current_user.id)
    return service.get_club_details(club_id)


# --- Leaderboard ---

@router.get("/clubs/{club_id}/leaderboard", response_model=list[ClubMemberRead], status_code=status.HTTP_200_OK)
def get_club_leaderboard(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the leaderboard of a specific club."""
    service = CommunityService(db, user_id=current_user.id)
    return service.get_leaderboard(club_id)


# --- Tasks ---

@router.post("/clubs/{club_id}/tasks", response_model=ClubTaskRead, status_code=status.HTTP_201_CREATED)
def create_club_task(
    club_id: int,
    request: ClubTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign a shared task to the club (Owner only)."""
    service = CommunityService(db, user_id=current_user.id)
    return service.create_club_task(club_id, request)


@router.get("/clubs/{club_id}/tasks", response_model=list[ClubTaskRead], status_code=status.HTTP_200_OK)
def get_club_tasks(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tasks assigned to a specific club."""
    service = CommunityService(db, user_id=current_user.id)
    return service.get_club_tasks(club_id)


@router.post("/tasks/{task_id}/complete", status_code=status.HTTP_200_OK)
def complete_club_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a club task as completed by the current user."""
    service = CommunityService(db, user_id=current_user.id)
    return service.complete_club_task(task_id)


# --- Feed Messages ---

@router.get("/clubs/{club_id}/feed", response_model=list[ClubFeedMessageRead], status_code=status.HTTP_200_OK)
def get_club_feed(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get feed messages and achievements for a specific club."""
    service = CommunityService(db, user_id=current_user.id)
    return service.get_feed_messages(club_id)


@router.post("/clubs/{club_id}/feed", response_model=ClubFeedMessageRead, status_code=status.HTTP_201_CREATED)
def post_feed_message(
    club_id: int,
    request: ClubFeedMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Post a manual message on the club feed wall."""
    service = CommunityService(db, user_id=current_user.id)
    feed_msg = service.post_feed_message(club_id, request)
    
    # Map to schema output
    return ClubFeedMessageRead(
        id=feed_msg.id,
        club_id=feed_msg.club_id,
        user_id=feed_msg.user_id,
        username=current_user.username,
        content=feed_msg.content,
        is_achievement=feed_msg.is_achievement,
        created_at=feed_msg.created_at
    )
