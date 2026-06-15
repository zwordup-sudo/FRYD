from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.users.security import get_current_user
from app.users.models import User

from .schemas import AnalyticsSummaryResponse
from .services import AnalyticsService

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummaryResponse, status_code=status.HTTP_200_OK)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive analytics summary for the authenticated user."""
    service = AnalyticsService(db, user_id=current_user.id)
    return service.get_summary()
