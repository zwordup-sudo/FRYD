from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


StatusType = Literal["pending", "in_progress", "completed"]


class CreateTaskSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    title: str = Field(..., examples=["Hacer la compra"])
    description: str | None = Field(None, examples=["Comprar leche y pan"])
    due_date: datetime = Field(..., examples=["2026-04-01T00:00:00"])
    status: StatusType = Field("pending", examples=["pending"])

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, value: datetime) -> datetime:
        value_naive = value.replace(tzinfo=None) if value.tzinfo is not None else value
        if value_naive < datetime.utcnow():
            raise ValueError("due_date no puede ser en el pasado")
        return value


class UpdateTaskSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    title: str | None = Field(None, examples=["Hacer la compra actualizada"])
    description: str | None = Field(None, examples=["Comprar leche, pan y huevos"])
    due_date: datetime | None = Field(None, examples=["2026-04-02T00:00:00"])
    status: StatusType | None = Field(None, examples=["in_progress"])

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, value: datetime | None) -> datetime | None:
        if value is not None:
            value_naive = value.replace(tzinfo=None) if value.tzinfo is not None else value
            if value_naive < datetime.utcnow():
                raise ValueError("due_date no puede ser en el pasado")
        return value


class TaskResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    due_date: datetime
    status: StatusType
    created_at: datetime
    updated_at: datetime