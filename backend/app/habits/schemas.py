from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


FrequencyType = Literal["daily", "weekly", "monthly"]
StatusType = Literal["active", "inactive"]


class CreateHabitSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    name: str = Field(..., examples=["Leer 10 páginas"])
    description: str | None = Field(None, examples=["Leer 10 páginas diarias"])
    frequency: FrequencyType = Field(..., examples=["daily"])
    status: StatusType = Field("active", examples=["active"])


class UpdateHabitSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    name: str | None = Field(None, examples=["Leer 10 páginas"])
    description: str | None = Field(None, examples=["Leer 10 páginas diarias"])
    frequency: FrequencyType | None = Field(None, examples=["daily"])
    status: StatusType | None = Field(None, examples=["active"])


class HabitLogSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    habit_id: int
    date: date
    created_at: datetime


class HabitLogToggleSchema(BaseModel):
    date: date


class HabitResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    frequency: FrequencyType
    status: StatusType
    created_at: datetime
    updated_at: datetime
    logs: list[HabitLogSchema] = []