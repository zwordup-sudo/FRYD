# Reglas del proyecto FRYD

## Propósito de este documento

Este archivo establece las reglas base para el desarrollo de FRYD y sirve como guía para futuras sesiones de trabajo, revisiones y generación de código.

---

## 1. Principio general

FRYD debe construirse con una base sólida desde el inicio para evitar parches, deuda técnica y decisiones improvisadas en etapas futuras.

Regla central:

**lento en la cimentación, ágil en la expansión**

---

## 2. Prioridad del proyecto

La prioridad actual no es agregar muchas funciones, sino asegurar que la arquitectura base sea correcta.

Antes de avanzar a etapas más complejas, deben quedar bien resueltos:

- estructura del backend
- organización modular
- consistencia de base de datos
- separación de responsabilidades
- claridad del dominio

---

## 3. Reglas de arquitectura

### 3.1 Arquitectura modular
El proyecto debe organizarse por dominios funcionales.

Módulos actuales:
- users
- tasks
- habits
- diary
- assistant

Cada módulo debe conservar, cuando aplique, sus propios archivos:
- `models.py`
- `schemas.py`
- `services.py`
- `router.py`

### 3.2 Base única compartida
Debe existir una sola Base compartida de SQLAlchemy para toda la aplicación.

La Base debe vivir en un archivo dedicado, por ejemplo:

- `app/db/base_class.py`

Ningún módulo debe crear su propio:

```python
Base = declarative_base()