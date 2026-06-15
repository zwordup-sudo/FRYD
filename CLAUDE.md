# FRYD Project Memory

## Project Overview
FRYD is a web app for productivity and personal support.

Main goal:
Build a platform focused on:
- tasks
- habits
- diary
- assistant chat

The project must prioritize a solid, modular, maintainable backend before adding advanced features.

---

## Current Stack
- Backend: FastAPI
- Frontend: web app
- Local LLM: Ollama
- Current coding model usually used in this environment: qwen2.5-coder:14b

---

## Development Principles
- Prioritize architecture before features
- Keep the code modular and easy to maintain
- Avoid premature complexity
- Prefer clarity over cleverness
- Build for the average user, not for developers only

Core rule:
**First clarity, then complexity.**

---

## Architecture Rules
1. Use a modular backend structure by domain:
   - users
   - tasks
   - habits
   - diary
   - assistant

2. Use one shared SQLAlchemy Base for the whole app.

3. The DB layer must stay separated:
   - `backend/app/db/base_class.py` -> shared Base
   - `backend/app/db/session.py` -> engine, SessionLocal, get_db
   - `backend/app/db/base.py` -> imports models to register metadata

4. Do not create multiple `declarative_base()` instances anywhere else.

5. Each module should keep its own files when applicable:
   - `models.py`
   - `schemas.py`
   - `services.py`
   - `router.py`

6. Do not centralize all domain logic in one monolithic file.

---

## What Has Been Materialized Already
The following files already exist in the real project and must be treated as the current source of truth:

- `README.md`
- `docs/project_rules.md`

Backend base:
- `backend/app/db/base_class.py`
- `backend/app/db/session.py`
- `backend/app/db/base.py`
- `backend/app/main.py`

Users module:
- `backend/app/users/models.py`
- `backend/app/users/schemas.py`
- `backend/app/users/services.py`
- `backend/app/users/router.py`

Assume these files exist unless the user says otherwise.

---

## Current Status
The backend base has started to be materialized.

The `users` module has also been materialized in a minimal form.

The project is still in the backend foundation phase.

Do not assume authentication, full CRUD, LLM integration, or advanced features are already implemented.

---

## What Not To Do Yet
Do not move to these areas unless the user explicitly asks for it:
- full authentication and authorization
- LLM integration
- advanced memory/context systems
- full CRUD for all modules at once
- major frontend work
- premature optimizations
- adding extra abstractions without need

---

## How To Work On This Project
When helping with FRYD:
- treat the files in the real project as the source of truth
- do not invent progress that does not exist
- do not assume previous session memory unless it is reflected in project files or explicitly restated by the user
- work in small, controlled steps
- prefer generating one block or one file group at a time
- keep answers practical and implementation-focused

---

## Expected Working Style
When generating code:
- keep it clean and minimal
- avoid unnecessary imports
- avoid unused code
- stay coherent with FastAPI + SQLAlchemy structure already used
- respect the shared DB base architecture
- do not silently change project conventions

When uncertain:
- ask for clarification instead of inventing structure

---

## Preferred Next Step
Unless the user says otherwise, the next recommended backend step is:
- continue with the `tasks` module

Suggested order:
1. `backend/app/tasks/models.py`
2. `backend/app/tasks/schemas.py`
3. `backend/app/tasks/services.py`
4. `backend/app/tasks/router.py`

---

## Important Reminder
If something is not present in the real project folder, it must not be treated as implemented.

Project reality is defined by actual files, not by previous chat output alone.