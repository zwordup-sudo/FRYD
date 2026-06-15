from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# --- Project Members ---
class ProjectMemberRead(BaseModel):
    project_id: int
    user_id: int
    username: str
    role: str
    points_earned: int
    joined_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# --- Projects ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    methodology: Optional[str] = "kanban"
    custom_columns: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectRead(ProjectBase):
    id: int
    invite_code: str
    owner_id: int
    created_at: datetime
    role: Optional[str] = None # Current user's role in this project
    member_count: Optional[int] = 0

    class Config:
        orm_mode = True
        from_attributes = True

class ProjectJoinRequest(BaseModel):
    invite_code: str

# --- Project Tasks ---
class ProjectTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    column_name: Optional[str] = "Por hacer"
    assigned_to: Optional[int] = None
    story_points: Optional[int] = 1
    xp_reward: Optional[int] = 15
    due_date: Optional[datetime] = None

class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    column_name: Optional[str] = None
    assigned_to: Optional[int] = None
    story_points: Optional[int] = None
    xp_reward: Optional[int] = None
    due_date: Optional[datetime] = None

class ProjectTaskRead(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    column_name: str
    assigned_to: Optional[int] = None
    assignee_username: Optional[str] = None
    story_points: int
    xp_reward: int
    due_date: Optional[datetime] = None
    completed: bool = False
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# --- Project Feed Messages ---
class ProjectFeedMessageCreate(BaseModel):
    content: str

class ProjectFeedMessageRead(BaseModel):
    id: int
    project_id: int
    user_id: int
    username: str
    content: str
    is_achievement: bool
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
