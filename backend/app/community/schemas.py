from datetime import datetime
from pydantic import BaseModel, Field

# --- Club Schemas ---
class ClubCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = Field(None, max_length=500)

class ClubRead(BaseModel):
    id: int
    name: str
    description: str | None
    invite_code: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ClubJoinRequest(BaseModel):
    invite_code: str

# --- Member Schemas ---
class ClubMemberRead(BaseModel):
    user_id: int
    username: str
    role: str
    points_earned: int
    joined_at: datetime

    class Config:
        from_attributes = True

# --- Task Schemas ---
class ClubTaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str | None = Field(None, max_length=1000)
    task_type: str = Field(..., description="individual, collaborative, competitive")
    xp_reward: int = Field(10, ge=1, le=100)
    due_date: datetime | None = None

class ClubTaskRead(BaseModel):
    id: int
    club_id: int
    title: str
    description: str | None
    task_type: str
    xp_reward: int
    due_date: datetime | None
    created_at: datetime
    is_completed: bool = False  # Set dynamically in service

    class Config:
        from_attributes = True

# --- Feed Schemas ---
class ClubFeedMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class ClubFeedMessageRead(BaseModel):
    id: int
    club_id: int
    user_id: int
    username: str
    content: str
    is_achievement: bool
    created_at: datetime

    class Config:
        from_attributes = True
