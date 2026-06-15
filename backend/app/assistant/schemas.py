from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# --- Chat schemas ---

RoleType = Literal["user", "assistant"]
ProviderType = Literal["ollama", "openai", "anthropic", "gemini"]


class ChatMessageRequest(BaseModel):
    """Schema for sending a message to the assistant."""

    message: str = Field(..., min_length=1, examples=["¿Cómo puedo mejorar mis hábitos?"])
    provider: ProviderType = Field("ollama", examples=["ollama"])
    model: str | None = Field(None, examples=["llama3"])
    api_key: str | None = Field(None, examples=["sk-..."])
    conversation_id: int | None = Field(None, examples=[1])


class ChatMessageResponse(BaseModel):
    """Schema for the assistant's response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: RoleType
    content: str
    provider: str | None
    model: str | None
    created_at: datetime


class ConversationResponse(BaseModel):
    """Schema for a conversation with its messages."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str | None
    provider: str
    model: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse] = []


class ConversationListItem(BaseModel):
    """Schema for listing conversations (without full messages)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str | None
    provider: str
    model: str | None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ProviderInfo(BaseModel):
    """Schema for available AI providers."""

    id: str
    name: str
    description: str
    requires_api_key: bool
    available_models: list[str]
    is_local: bool


class TestConnectionRequest(BaseModel):
    """Schema for testing connection to a provider."""

    provider: ProviderType = Field(..., examples=["ollama"])
    api_key: str | None = Field(None, examples=["sk-..."])
    model: str | None = Field(None, examples=["llama3"])


class TestConnectionResponse(BaseModel):
    """Schema for the connection test result."""

    success: bool
    message: str
    provider: str


# --- Legacy schemas (backward compatibility) ---

class AssistantInteractionCreate(BaseModel):
    user_input: str
    response: str


class AssistantInteractionRead(BaseModel):
    id: int
    user_input: str
    response: str

    model_config = ConfigDict(from_attributes=True)


# --- Graph schemas ---

class GraphNodeSchema(BaseModel):
    id: str
    label: str
    type: str
    details: dict | None = None


class GraphLinkSchema(BaseModel):
    source: str
    target: str
    type: str


class GraphResponseSchema(BaseModel):
    nodes: list[GraphNodeSchema]
    links: list[GraphLinkSchema]


# --- Insights schemas ---

class InsightItem(BaseModel):
    icon: str
    title: str
    description: str
    type: str  # "success", "warning", "info", "tip"