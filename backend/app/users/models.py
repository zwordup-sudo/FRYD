from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)

    # WhatsApp Integration Settings
    _whatsapp_phone = Column("whatsapp_phone", String, unique=True, index=True, nullable=True)
    whatsapp_active = Column(Boolean, default=False)
    whatsapp_sandbox = Column(String, nullable=True)

    # AI Assistant Settings
    ai_provider = Column(String, default="ollama", nullable=True)
    ai_model = Column(String, default="llama3", nullable=True)
    _ai_api_key = Column("ai_api_key", String, nullable=True)

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    diary_entries = relationship("Entry", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")

    @property
    def whatsapp_phone(self) -> str | None:
        from .security_utils import decrypt_data
        return decrypt_data(self._whatsapp_phone)

    @whatsapp_phone.setter
    def whatsapp_phone(self, value: str | None) -> None:
        from .security_utils import encrypt_data
        self._whatsapp_phone = encrypt_data(value)

    @property
    def ai_api_key(self) -> str | None:
        from .security_utils import decrypt_data
        return decrypt_data(self._ai_api_key)

    @ai_api_key.setter
    def ai_api_key(self, value: str | None) -> None:
        from .security_utils import encrypt_data
        self._ai_api_key = encrypt_data(value)