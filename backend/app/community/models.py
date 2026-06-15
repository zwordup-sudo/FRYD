from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Club(Base):
    __tablename__ = "clubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    invite_code = Column(String(50), unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("ClubMember", back_populates="club", cascade="all, delete-orphan")
    tasks = relationship("ClubTask", back_populates="club", cascade="all, delete-orphan")
    feed_messages = relationship("ClubFeedMessage", back_populates="club", cascade="all, delete-orphan")

class ClubMember(Base):
    __tablename__ = "club_members"

    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(String(20), nullable=False, default="member") # "owner" or "member"
    points_earned = Column(Integer, nullable=False, default=0)
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    club = relationship("Club", back_populates="members")
    user = relationship("User")

class ClubTask(Base):
    __tablename__ = "club_tasks"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    task_type = Column(String(50), nullable=False) # "individual", "collaborative", "competitive"
    xp_reward = Column(Integer, nullable=False, default=10)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    club = relationship("Club", back_populates="tasks")
    completions = relationship("ClubTaskCompletion", back_populates="club_task", cascade="all, delete-orphan")

class ClubTaskCompletion(Base):
    __tablename__ = "club_task_completions"

    id = Column(Integer, primary_key=True, index=True)
    club_task_id = Column(Integer, ForeignKey("club_tasks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    club_task = relationship("ClubTask", back_populates="completions")
    user = relationship("User")

class ClubFeedMessage(Base):
    __tablename__ = "club_feed_messages"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_achievement = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    club = relationship("Club", back_populates="feed_messages")
    user = relationship("User")
