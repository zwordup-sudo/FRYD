from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.users.security import limiter

from app.db.base_class import Base
from app.db.session import SessionLocal, engine
from app.db import base  # noqa: F401

from app.users.router import router as users_router
from app.tasks.router import router as tasks_router
from app.habits.router import router as habits_router
from app.diary.router import router as diary_router
from app.assistant.router import router as assistant_router
from app.analytics.router import router as analytics_router
from app.projects.router import router as projects_router

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Crea las tablas si no existen
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
    ],
    allow_origin_regex=r"https://.*\.loca\.lt",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


@app.get("/health")
def read_health():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception:
        raise HTTPException(status_code=500, detail="Database connection failed")
    finally:
        db.close()


app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(tasks_router, prefix="/tasks", tags=["Tasks"])
app.include_router(habits_router, prefix="/habits", tags=["Habits"])
app.include_router(diary_router, prefix="/diary", tags=["Diary"])
app.include_router(assistant_router, prefix="/assistant", tags=["Assistant"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(projects_router, prefix="/projects", tags=["Projects"])