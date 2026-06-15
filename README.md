# FRYD

FRYD es una web app de productividad y acompañamiento personal.

## Objetivo

Construir una plataforma enfocada en ayudar al usuario a organizar su vida personal y académica mediante herramientas simples, claras y útiles para:

- gestionar tareas
- dar seguimiento a hábitos
- registrar entradas de diario personal
- interactuar con un asistente

La prioridad del proyecto es lograr una base sólida, mantenible y escalable, sin sacrificar facilidad de uso para el usuario promedio.

## Enfoque del proyecto

FRYD no busca ser solo una app con muchas funciones, sino una plataforma bien pensada desde la base.  
Por ello, el desarrollo se está realizando con énfasis en:

- arquitectura limpia
- modularidad
- escalabilidad
- claridad de código
- experiencia de usuario simple y comprensible

## Stack inicial

### Backend
- FastAPI

### Frontend
- Web app

### LLM local
- Ollama

### Modelo principal actual para desarrollo/código
- qwen2.5-coder:14b

## Módulos iniciales

- users
- tasks
- habits
- diary
- assistant

## Etapa actual

Primera fase de construcción del backend y definición de la arquitectura base.

En este momento el proyecto está centrado en:

- definir una estructura modular correcta
- establecer una base consistente para SQLAlchemy
- separar responsabilidades por módulo
- evitar crecer funcionalmente antes de cerrar bien la cimentación

## Prioridad inmediata

Antes de avanzar a funcionalidades complejas, FRYD debe contar con una base arquitectónica correcta.

Esto incluye:

- una sola Base compartida de SQLAlchemy
- separación clara entre base, sesión y agregación de modelos
- modelos organizados por módulo
- estructura coherente entre `db`, `main` y los módulos de dominio

## Estado del desarrollo

Actualmente, parte del trabajo previo ha sido principalmente de diseño, propuesta de estructura y revisión técnica.  
Por lo tanto, no todo lo discutido anteriormente debe considerarse implementado realmente hasta que exista como archivo en la carpeta real del proyecto.

## Principio de trabajo

En FRYD se seguirá esta idea:

**primero claridad, luego complejidad**

Es decir:
1. construir una base sólida
2. validar arquitectura
3. después agregar funcionalidades
4. finalmente integrar capacidades más avanzadas

## Nota importante

Cualquier cambio futuro debe respetar la meta de mantener FRYD:

- limpio
- entendible
- escalable
- útil para el usuario promedio