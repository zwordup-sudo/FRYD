from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.users.security import get_current_user
from app.users.models import User

from .schemas import CreateDiaryEntrySchema, DiaryResponseSchema, UpdateDiaryEntrySchema, TaskExtractRequestSchema, ExtractedTaskSchema
from .services import DiaryService
from .task_extractor import TaskExtractor

router = APIRouter()


@router.post("/extract-tasks", response_model=list[ExtractedTaskSchema], status_code=status.HTTP_200_OK)
async def extract_tasks_from_diary(
    request: TaskExtractRequestSchema,
    current_user: User = Depends(get_current_user),
):
    """Extract pending tasks from a diary entry content using the configured AI provider."""
    return await TaskExtractor.extract_tasks(
        content=request.content,
        provider_id=request.provider,
        model=request.model,
        api_key=request.api_key
    )


@router.post("/", response_model=DiaryResponseSchema, status_code=status.HTTP_201_CREATED)
def create_diary_entry(
    entry_data: CreateDiaryEntrySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiaryService(db, user_id=current_user.id)
    return service.create(entry_data)


@router.get("/", response_model=list[DiaryResponseSchema], status_code=status.HTTP_200_OK)
def list_diary_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiaryService(db, user_id=current_user.id)
    return service.get_all()


@router.get("/{entry_id}", response_model=DiaryResponseSchema, status_code=status.HTTP_200_OK)
def get_diary_entry_by_id(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiaryService(db, user_id=current_user.id)
    return service.get_by_id(entry_id)


@router.patch("/{entry_id}", response_model=DiaryResponseSchema, status_code=status.HTTP_200_OK)
def update_diary_entry(
    entry_id: int,
    entry_data: UpdateDiaryEntrySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiaryService(db, user_id=current_user.id)
    return service.update(entry_id, entry_data)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diary_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DiaryService(db, user_id=current_user.id)
    service.delete(entry_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)