from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


MoodType = Literal["happy", "sad", "annoyed", "excited", "neutral", "stressed", "calm"]


class CreateDiaryEntrySchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    title: str | None = Field(None, examples=["Mi día"])
    content: str | None = Field(None, examples=["Hoy fue un día interesante..."])
    mood: MoodType | None = Field(None, examples=["calm"])
    energy_level: int | None = Field(None, ge=1, le=5, examples=[4])
    tags: list[str] | None = Field(None, examples=[["reflexión", "salud", "ideas"]])
    is_private: bool | None = Field(None, examples=[True])

    @model_validator(mode="after")
    def validate_title_or_content(self):
        if self.title is None and self.content is None:
            raise ValueError("Debe haber por lo menos título o contenido")
        return self


class UpdateDiaryEntrySchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    title: str | None = Field(None, examples=["Mi día"])
    content: str | None = Field(None, examples=["Hoy fue un día interesante..."])
    mood: MoodType | None = Field(None, examples=["calm"])
    energy_level: int | None = Field(None, ge=1, le=5, examples=[4])
    tags: list[str] | None = Field(None, examples=[["reflexión", "salud", "ideas"]])
    is_private: bool | None = Field(None, examples=[True])


class DiaryResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str | None
    content: str | None
    mood: MoodType | None
    energy_level: int | None
    tags: list[str] | None
    is_private: bool
    created_at: datetime
    updated_at: datetime


class TaskExtractRequestSchema(BaseModel):
    content: str
    provider: str
    model: str | None = None
    api_key: str | None = None


class ExtractedTaskSchema(BaseModel):
    title: str
    description: str | None = None
    due_date: str | None = None