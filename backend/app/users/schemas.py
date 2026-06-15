
from pydantic import BaseModel, ConfigDict, field_validator

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserRead(BaseModel):
    id: int
    username: str
    email: str
    whatsapp_phone: str | None = None
    whatsapp_active: bool | None = False
    whatsapp_sandbox: str | None = None
    ai_provider: str | None = "ollama"
    ai_model: str | None = "llama3"
    ai_api_key: str | None = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("ai_api_key", mode="before")
    @classmethod
    def mask_api_key(cls, v: str | None) -> str | None:
        if v:
            if len(v) > 8:
                return f"{v[:4]}...{v[-4:]}"
            return "••••••••"
        return v

class UserSettingsUpdate(BaseModel):
    username: str | None = None
    whatsapp_phone: str | None = None
    whatsapp_active: bool | None = None
    whatsapp_sandbox: str | None = None
    ai_provider: str | None = None
    ai_model: str | None = None
    ai_api_key: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None