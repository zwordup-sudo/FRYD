import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import Entry
from .schemas import CreateDiaryEntrySchema, DiaryResponseSchema, UpdateDiaryEntrySchema


class DiaryService:
    def __init__(self, db: Session, user_id: int | None = None):
        self.db = db
        self.user_id = user_id

    def _parse_tags(self, tags: str | None) -> list[str]:
        return json.loads(tags) if tags else []

    def _dump_tags(self, tags: list[str] | None) -> str:
        final_tags = tags if tags and len(tags) > 0 else ["general"]
        return json.dumps(final_tags)

    def _to_response(self, entry: Entry) -> DiaryResponseSchema:
        return DiaryResponseSchema(
            id=entry.id,
            title=entry.title,
            content=entry.content,
            mood=entry.mood,
            energy_level=entry.energy_level,
            tags=self._parse_tags(entry.tags),
            is_private=entry.is_private,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
        )

    def _validate_title_or_content(self, title: str | None, content: str | None) -> None:
        if not title and not content:
            raise HTTPException(
                status_code=400,
                detail="Debe haber por lo menos título o contenido",
            )

    def create(self, entry_data: CreateDiaryEntrySchema) -> DiaryResponseSchema:
        data = entry_data.model_dump(exclude_none=True)

        self._validate_title_or_content(
            data.get("title"),
            data.get("content"),
        )

        data["tags"] = self._dump_tags(data.get("tags"))
        data["is_private"] = data.get("is_private", True)

        entry = Entry(**data, user_id=self.user_id)
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)

        return self._to_response(entry)

    def get_all(self) -> list[DiaryResponseSchema]:
        query = self.db.query(Entry)
        if self.user_id is not None:
            query = query.filter(Entry.user_id == self.user_id)
        entries = query.order_by(Entry.created_at.desc()).all()
        return [self._to_response(entry) for entry in entries]

    def get_by_id(self, entry_id: int) -> DiaryResponseSchema:
        entry = self.db.get(Entry, entry_id)
        if not entry or (self.user_id is not None and entry.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Entrada no encontrada")

        return self._to_response(entry)

    def update(self, entry_id: int, entry_data: UpdateDiaryEntrySchema) -> DiaryResponseSchema:
        entry = self.db.get(Entry, entry_id)
        if not entry or (self.user_id is not None and entry.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Entrada no encontrada")

        data = entry_data.model_dump(exclude_unset=True)

        if "is_private" in data and data["is_private"] is None:
            raise HTTPException(
                status_code=400,
                detail="is_private no puede ser null",
            )

        final_title = data.get("title", entry.title)
        final_content = data.get("content", entry.content)
        self._validate_title_or_content(final_title, final_content)

        if "tags" in data:
            data["tags"] = self._dump_tags(data["tags"])

        for key, value in data.items():
            setattr(entry, key, value)

        self.db.commit()
        self.db.refresh(entry)

        return self._to_response(entry)

    def delete(self, entry_id: int) -> None:
        entry = self.db.get(Entry, entry_id)
        if not entry or (self.user_id is not None and entry.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Entrada no encontrada")

        self.db.delete(entry)
        self.db.commit()