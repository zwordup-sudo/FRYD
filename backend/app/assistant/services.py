from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import Conversation, Interaction, Message
from .providers.registry import get_provider, list_providers
from app.tasks.models import Task
from app.habits.models import Habit
from app.diary.models import Entry
from app.projects.models import Project, ProjectMember, ProjectTask, ProjectTaskCompletion
from .schemas import (
    AssistantInteractionCreate,
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationListItem,
    ConversationResponse,
    ProviderInfo,
    TestConnectionRequest,
    TestConnectionResponse,
)


class AssistantService:
    def __init__(self, db: Session, user_id: int | None = None):
        self.db = db
        self.user_id = user_id

    # --- Chat ---

    async def chat(self, request: ChatMessageRequest) -> ChatMessageResponse:
        """Send a message and get an AI response."""

        # Get or create conversation
        if request.conversation_id:
            conversation = self.db.get(Conversation, request.conversation_id)
            if not conversation or (self.user_id is not None and conversation.user_id != self.user_id):
                raise HTTPException(status_code=404, detail="Conversación no encontrada")
        else:
            conversation = Conversation(
                provider=request.provider,
                model=request.model,
                title=request.message[:100] if request.message else "Nueva conversación",
                user_id=self.user_id,
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )
        self.db.add(user_message)
        self.db.commit()
        self.db.refresh(user_message)

        # Get conversation history for context
        history = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .all()
        )

    def _build_context_prompt(self) -> str:
        """Build the contextual system prompt based on user's database records."""
        context_prompt = (
            "Eres FRYD, un asistente inteligente de productividad y bienestar personal integrado directamente en la plataforma del usuario. "
            "Tu objetivo es ayudar al usuario a mantenerse enfocado, motivado y reflexivo. "
            "IMPORTANTE: Tienes acceso directo a la base de datos de tareas, hábitos y diario del usuario, la cual se te inyecta en tiempo real a continuación. "
            "Si el usuario te pregunta por su progreso, por sus tareas, hábitos o diario, o te pregunta si puedes acceder a ellos, responde afirmativamente y usa los datos provistos abajo. "
            "NUNCA digas que no tienes acceso a sus datos personales, dispositivo o aplicación, puesto que están provistos abajo en este mismo prompt.\n"
            "Responde siempre en español, usando Markdown cuando sea útil (listas, negritas, cursivas).\n\n"
        )

        if self.user_id:
            # Query tasks
            tasks = self.db.query(Task).filter(Task.user_id == self.user_id).all()
            completed_tasks = [t for t in tasks if t.status == "completed"]
            pending_tasks = [t for t in tasks if t.status != "completed"]

            context_prompt += f"### Resumen de Tareas ({len(completed_tasks)}/{len(tasks)} completadas):\n"
            if tasks:
                for t in tasks:
                    status_str = "✅ Completada" if t.status == "completed" else "⏳ Pendiente"
                    due_str = t.due_date.strftime("%Y-%m-%d") if t.due_date else "Sin fecha"
                    context_prompt += f"- {t.title} | {status_str} | Vence: {due_str}\n"
            else:
                context_prompt += "No tiene tareas registradas.\n"
            context_prompt += "\n"

            # Query habits with consistency metrics
            habits = self.db.query(Habit).filter(Habit.user_id == self.user_id).all()
            active_habits = [h for h in habits if h.status == "active"]

            context_prompt += f"### Hábitos ({len(active_habits)} activos de {len(habits)} total):\n"
            if habits:
                from datetime import date, timedelta
                today = date.today()
                thirty_days_ago = today - timedelta(days=30)

                for h in habits:
                    completions = len(h.logs) if hasattr(h, 'logs') else 0
                    # Calculate 30-day consistency
                    recent_logs = [l for l in (h.logs or []) if l.date and l.date >= thirty_days_ago]
                    consistency = round((len(recent_logs) / 30) * 100, 1) if h.status == "active" else 0
                    context_prompt += f"- {h.name} | {h.frequency} | {h.status} | {completions} completados total | Consistencia 30d: {consistency}%\n"
            else:
                context_prompt += "No tiene hábitos registrados.\n"
            context_prompt += "\n"

            # Query recent diary entries with trend analysis
            entries = self.db.query(Entry).filter(Entry.user_id == self.user_id).order_by(Entry.created_at.desc()).limit(5).all()
            if entries:
                # Calculate mood distribution
                from collections import Counter
                all_entries = self.db.query(Entry).filter(Entry.user_id == self.user_id).all()
                mood_counts = Counter(e.mood for e in all_entries if e.mood)
                energy_values = [e.energy_level for e in all_entries if e.energy_level]
                avg_energy = round(sum(energy_values) / len(energy_values), 1) if energy_values else 0

                context_prompt += f"### Diario (Energía promedio: {avg_energy}/5 | Ánimo más frecuente: {mood_counts.most_common(1)[0][0] if mood_counts else 'N/A'}):\n"
                for e in entries:
                    date_str = e.created_at.strftime("%Y-%m-%d") if e.created_at else "Sin fecha"
                    context_prompt += f"- {date_str} | Ánimo: {e.mood} | Energía: {e.energy_level}/5 | Tags: {e.tags or 'ninguno'}\n"
                    if e.content:
                        context_prompt += f"  Nota: {e.content[:150]}...\n"
                context_prompt += "\n"

                # Add trend insight
                recent_energy = [e.energy_level for e in entries[:3] if e.energy_level]
                older_energy = [e.energy_level for e in entries[3:] if e.energy_level]
                if recent_energy and older_energy:
                    recent_avg = sum(recent_energy) / len(recent_energy)
                    older_avg = sum(older_energy) / len(older_energy)
                    if recent_avg < older_avg - 0.5:
                        context_prompt += "⚠️ TENDENCIA: La energía del usuario ha bajado recientemente. Considera preguntar sobre su bienestar.\n\n"
                    elif recent_avg > older_avg + 0.5:
                        context_prompt += "📈 TENDENCIA: La energía del usuario ha mejorado recientemente. ¡Refuerza positivamente!\n\n"

        return context_prompt

    async def chat(self, request: ChatMessageRequest) -> ChatMessageResponse:
        """Send a message and get an AI response."""

        # Get or create conversation
        if request.conversation_id:
            conversation = self.db.get(Conversation, request.conversation_id)
            if not conversation or (self.user_id is not None and conversation.user_id != self.user_id):
                raise HTTPException(status_code=404, detail="Conversación no encontrada")
        else:
            conversation = Conversation(
                provider=request.provider,
                model=request.model,
                title=request.message[:100] if request.message else "Nueva conversación",
                user_id=self.user_id,
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )
        self.db.add(user_message)
        self.db.commit()
        self.db.refresh(user_message)

        # Get conversation history for context
        history = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .all()
        )

        context_prompt = self._build_context_prompt()

        # Build messages list for the AI provider
        messages = [{"role": "system", "content": context_prompt}]
        messages.extend([{"role": msg.role, "content": msg.content} for msg in history])

        # Get AI response
        try:
            provider = get_provider(request.provider)
            ai_response = await provider.generate(
                messages=messages,
                model=request.model,
                api_key=request.api_key,
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            ai_response = f"Error al comunicarse con {request.provider}: {str(e)}"

        # Save assistant message
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response,
            provider=request.provider,
            model=request.model,
        )
        self.db.add(assistant_message)
        self.db.commit()
        self.db.refresh(assistant_message)

        return ChatMessageResponse(
            id=assistant_message.id,
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response,
            provider=request.provider,
            model=request.model,
            created_at=assistant_message.created_at,
        )

    async def chat_stream(self, request: ChatMessageRequest):
        """Send a message and get an AI response stream via Server-Sent Events."""
        import json

        # Get or create conversation
        if request.conversation_id:
            conversation = self.db.get(Conversation, request.conversation_id)
            if not conversation or (self.user_id is not None and conversation.user_id != self.user_id):
                raise HTTPException(status_code=404, detail="Conversación no encontrada")
        else:
            conversation = Conversation(
                provider=request.provider,
                model=request.model,
                title=request.message[:100] if request.message else "Nueva conversación",
                user_id=self.user_id,
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)

        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )
        self.db.add(user_message)
        self.db.commit()
        self.db.refresh(user_message)

        # Get conversation history for context
        history = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .all()
        )

        context_prompt = self._build_context_prompt()

        # Build messages list for the AI provider
        messages = [{"role": "system", "content": context_prompt}]
        messages.extend([{"role": msg.role, "content": msg.content} for msg in history])

        async def event_generator():
            # 1. Send the conversation info first
            yield f"event: info\ndata: {json.dumps({'conversation_id': conversation.id})}\n\n"

            full_response = ""
            try:
                provider = get_provider(request.provider)
                async for chunk in provider.generate_stream(
                    messages=messages,
                    model=request.model,
                    api_key=request.api_key,
                ):
                    full_response += chunk
                    yield f"data: {json.dumps({'token': chunk})}\n\n"
            except ValueError as e:
                yield f"event: error\ndata: {json.dumps({'detail': str(e)})}\n\n"
                return
            except Exception as e:
                err_msg = f"Error al comunicarse con {request.provider}: {str(e)}"
                full_response = err_msg
                yield f"event: error\ndata: {json.dumps({'detail': err_msg})}\n\n"
                return

            # Save assistant message to DB
            assistant_message = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response,
                provider=request.provider,
                model=request.model,
            )
            self.db.add(assistant_message)
            self.db.commit()
            self.db.refresh(assistant_message)

            # Send done event
            yield f"event: done\ndata: {json.dumps({'id': assistant_message.id, 'created_at': assistant_message.created_at.isoformat()})}\n\n"

        return event_generator()

    # --- Conversations ---

    def get_conversations(self) -> list[ConversationListItem]:
        """List all conversations ordered by most recent."""
        query = self.db.query(Conversation)
        if self.user_id is not None:
            query = query.filter(Conversation.user_id == self.user_id)
        conversations = query.order_by(Conversation.updated_at.desc()).all()

        result = []
        for conv in conversations:
            msg_count = (
                self.db.query(Message)
                .filter(Message.conversation_id == conv.id)
                .count()
            )
            result.append(
                ConversationListItem(
                    id=conv.id,
                    title=conv.title,
                    provider=conv.provider,
                    model=conv.model,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                    message_count=msg_count,
                )
            )
        return result

    def get_conversation(self, conversation_id: int) -> ConversationResponse:
        """Get a conversation with all its messages."""
        conversation = self.db.get(Conversation, conversation_id)
        if not conversation or (self.user_id is not None and conversation.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Conversación no encontrada")

        messages = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .all()
        )

        return ConversationResponse(
            id=conversation.id,
            title=conversation.title,
            provider=conversation.provider,
            model=conversation.model,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=[
                ChatMessageResponse(
                    id=msg.id,
                    conversation_id=msg.conversation_id,
                    role=msg.role,
                    content=msg.content,
                    provider=msg.provider,
                    model=msg.model,
                    created_at=msg.created_at,
                )
                for msg in messages
            ],
        )

    def delete_conversation(self, conversation_id: int) -> None:
        """Delete a conversation and all its messages."""
        conversation = self.db.get(Conversation, conversation_id)
        if not conversation or (self.user_id is not None and conversation.user_id != self.user_id):
            raise HTTPException(status_code=404, detail="Conversación no encontrada")

        self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).delete()
        self.db.delete(conversation)
        self.db.commit()

    # --- Providers ---

    def get_providers(self) -> list[ProviderInfo]:
        """List all available AI providers."""
        return list_providers()

    async def test_provider_connection(
        self, request: TestConnectionRequest
    ) -> TestConnectionResponse:
        """Test connection to a specific AI provider."""
        try:
            provider = get_provider(request.provider)
            success, message = await provider.test_connection(
                model=request.model,
                api_key=request.api_key,
            )
            return TestConnectionResponse(
                success=success,
                message=message,
                provider=request.provider,
            )
        except ValueError as e:
            return TestConnectionResponse(
                success=False,
                message=str(e),
                provider=request.provider,
            )

    # --- Legacy (backward compatibility) ---

    def create_interaction(
        self, data: AssistantInteractionCreate
    ) -> Interaction:
        """Legacy: create an interaction record."""
        interaction = Interaction(
            user_input=data.user_input,
            response=data.response,
        )
        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction)
        return interaction

    def get_interaction_by_id(self, interaction_id: int) -> Interaction | None:
        """Legacy: get interaction by ID."""
        return self.db.get(Interaction, interaction_id)

    def get_graph_data(self) -> dict:
        """Generate a knowledge graph of habits, tasks, diary entries, and tags."""
        import json
        
        nodes = []
        links = []
        
        # 1. Fetch data
        habits = self.db.query(Habit)
        tasks = self.db.query(Task)
        diary_entries = self.db.query(Entry)
        
        if self.user_id is not None:
            habits = habits.filter(Habit.user_id == self.user_id)
            tasks = tasks.filter(Task.user_id == self.user_id)
            diary_entries = diary_entries.filter(Entry.user_id == self.user_id)
            
        habits = habits.all()
        tasks = tasks.all()
        diary_entries = diary_entries.all()
        
        # Helper structures
        diary_by_date = {}  # maps date_str -> node_id
        concepts = set()  # tracks unique tags
        
        # 2. Process Diary Entries
        for entry in diary_entries:
            date_str = entry.created_at.strftime("%Y-%m-%d")
            node_id = f"diary_{entry.id}"
            diary_by_date[date_str] = node_id
            
            # Extract tags
            entry_tags = []
            if entry.tags:
                try:
                    entry_tags = json.loads(entry.tags)
                except Exception:
                    pass
            
            nodes.append({
                "id": node_id,
                "label": f"{date_str} {entry.mood or '📝'}",
                "type": "diary",
                "details": {
                    "title": entry.title or f"Entrada {date_str}",
                    "content": entry.content or "",
                    "mood": entry.mood or "",
                    "energy_level": entry.energy_level or 0,
                    "tags": entry_tags,
                    "date": date_str
                }
            })
            
            # Connect diary to its tags
            for tag in entry_tags:
                concepts.add(tag)
                links.append({
                    "source": node_id,
                    "target": f"concept_{tag}",
                    "type": "has_concept"
                })
                
        # 3. Process Habits
        for habit in habits:
            node_id = f"habit_{habit.id}"
            nodes.append({
                "id": node_id,
                "label": habit.name,
                "type": "habit",
                "details": {
                    "description": habit.description or "",
                    "frequency": habit.frequency,
                    "status": habit.status,
                    "completions_count": len(habit.logs) if hasattr(habit, 'logs') else 0
                }
            })
            
            # Connect habit to diary entries of completion dates
            if hasattr(habit, 'logs'):
                for log in habit.logs:
                    log_date_str = log.date.strftime("%Y-%m-%d")
                    if log_date_str in diary_by_date:
                        links.append({
                            "source": node_id,
                            "target": diary_by_date[log_date_str],
                            "type": "completed_on"
                        })
                        
        # 4. Process Tasks
        for task in tasks:
            node_id = f"task_{task.id}"
            nodes.append({
                "id": node_id,
                "label": task.title,
                "type": "task",
                "details": {
                    "description": task.description or "",
                    "status": task.status,
                    "due_date": task.due_date.strftime("%Y-%m-%d") if task.due_date else None,
                    "completed_at": task.updated_at.strftime("%Y-%m-%d") if task.status == "completed" and task.updated_at else None
                }
            })
            
            # Connect completed task to diary entry of completion date
            if task.status == "completed" and task.updated_at:
                comp_date_str = task.updated_at.strftime("%Y-%m-%d")
                if comp_date_str in diary_by_date:
                    links.append({
                        "source": node_id,
                        "target": diary_by_date[comp_date_str],
                        "type": "completed_on"
                    })

        # 4.5 Process Projects and Project Tasks
        if self.user_id is not None:
            member_project_ids = [
                pm.project_id for pm in self.db.query(ProjectMember).filter(ProjectMember.user_id == self.user_id).all()
            ]
            owned_project_ids = [
                p.id for p in self.db.query(Project).filter(Project.owner_id == self.user_id).all()
            ]
            project_ids = list(set(member_project_ids + owned_project_ids))
            
            if project_ids:
                projects = self.db.query(Project).filter(Project.id.in_(project_ids)).all()
                for project in projects:
                    proj_node_id = f"project_{project.id}"
                    nodes.append({
                        "id": proj_node_id,
                        "label": f"📁 {project.name}",
                        "type": "project",
                        "details": {
                            "name": project.name,
                            "description": project.description or "",
                            "methodology": project.methodology,
                            "created_at": project.created_at.strftime("%Y-%m-%d")
                        }
                    })
                    
                    proj_tasks = self.db.query(ProjectTask).filter(ProjectTask.project_id == project.id).all()
                    for pt in proj_tasks:
                        pt_node_id = f"project_task_{pt.id}"
                        nodes.append({
                            "id": pt_node_id,
                            "label": pt.title,
                            "type": "project_task",
                            "details": {
                                "title": pt.title,
                                "description": pt.description or "",
                                "column_name": pt.column_name,
                                "story_points": pt.story_points,
                                "xp_reward": pt.xp_reward,
                                "due_date": pt.due_date.strftime("%Y-%m-%d") if pt.due_date else None,
                                "created_at": pt.created_at.strftime("%Y-%m-%d")
                            }
                        })
                        
                        links.append({
                            "source": pt_node_id,
                            "target": proj_node_id,
                            "type": "belongs_to_project"
                        })
                        
                        completion = self.db.query(ProjectTaskCompletion).filter(
                            ProjectTaskCompletion.project_task_id == pt.id,
                            ProjectTaskCompletion.user_id == self.user_id
                        ).first()
                        if completion:
                            comp_date_str = completion.completed_at.strftime("%Y-%m-%d")
                            if comp_date_str in diary_by_date:
                                links.append({
                                    "source": pt_node_id,
                                    "target": diary_by_date[comp_date_str],
                                    "type": "completed_on"
                                })
                                
        # 5. Add Concept Nodes
        for tag in concepts:
            nodes.append({
                "id": f"concept_{tag}",
                "label": f"🧠 {tag}",
                "type": "concept",
                "details": {}
            })
            
        return {"nodes": nodes, "links": links}

    # --- Insights ---

    def get_insights(self) -> list[dict]:
        """Generate smart daily insights based on user data."""
        from datetime import date, timedelta
        from collections import Counter

        insights = []
        today = date.today()
        seven_days_ago = today - timedelta(days=7)
        thirty_days_ago = today - timedelta(days=30)

        if not self.user_id:
            return insights

        # Fetch data
        tasks = self.db.query(Task).filter(Task.user_id == self.user_id).all()
        habits = self.db.query(Habit).filter(Habit.user_id == self.user_id).all()
        entries = self.db.query(Entry).filter(Entry.user_id == self.user_id).order_by(Entry.created_at.desc()).all()
        active_habits = [h for h in habits if h.status == "active"]

        # 1. Task completion rate
        if tasks:
            completed = len([t for t in tasks if t.status == "completed"])
            rate = round((completed / len(tasks)) * 100)
            if rate >= 80:
                insights.append({
                    "icon": "🏆",
                    "title": "Productividad excelente",
                    "description": f"Has completado {completed} de {len(tasks)} tareas ({rate}%). ¡Increíble rendimiento!",
                    "type": "success"
                })
            elif rate < 40 and len(tasks) >= 3:
                pending = len(tasks) - completed
                insights.append({
                    "icon": "⚡",
                    "title": f"{pending} tareas pendientes",
                    "description": f"Tu tasa de completado es {rate}%. Intenta enfocarte en las más urgentes primero.",
                    "type": "warning"
                })

        # 2. Habit consistency
        if active_habits:
            best_habit = None
            best_rate = 0
            worst_habit = None
            worst_rate = 100

            for h in active_habits:
                recent_logs = [l for l in (h.logs or []) if l.date and l.date >= thirty_days_ago]
                rate = round((len(recent_logs) / 30) * 100, 1)
                if rate > best_rate:
                    best_rate = rate
                    best_habit = h.name
                if rate < worst_rate:
                    worst_rate = rate
                    worst_habit = h.name

            if best_habit and best_rate >= 60:
                insights.append({
                    "icon": "🔥",
                    "title": f"'{best_habit}' es tu hábito estrella",
                    "description": f"Tienes {best_rate}% de consistencia en los últimos 30 días. ¡Sigue así!",
                    "type": "success"
                })

            if worst_habit and worst_rate < 30 and len(active_habits) > 1:
                insights.append({
                    "icon": "💡",
                    "title": f"'{worst_habit}' necesita atención",
                    "description": f"Solo {worst_rate}% de consistencia. ¿Quizás ajustar la frecuencia te ayude?",
                    "type": "tip"
                })

        # 3. Diary streak
        if entries:
            entry_dates = sorted(set(e.created_at.date() for e in entries if e.created_at), reverse=True)
            streak = 0
            expected = today
            if entry_dates and (entry_dates[0] == today or entry_dates[0] == today - timedelta(days=1)):
                if entry_dates[0] != today:
                    expected = today - timedelta(days=1)
                for d in entry_dates:
                    if d == expected:
                        streak += 1
                        expected -= timedelta(days=1)
                    elif d < expected:
                        break

            if streak >= 7:
                insights.append({
                    "icon": "📝",
                    "title": f"Racha de {streak} días en el diario",
                    "description": "Tu constancia en el diario es impresionante. La reflexión diaria es clave para el crecimiento.",
                    "type": "success"
                })
            elif streak == 0 and entries:
                insights.append({
                    "icon": "📝",
                    "title": "¿Cómo fue tu día?",
                    "description": "No has escrito en tu diario hoy. Tómate un minuto para reflexionar.",
                    "type": "info"
                })

        # 4. Energy trend
        if len(entries) >= 3:
            recent_energy = [e.energy_level for e in entries[:3] if e.energy_level]
            if recent_energy:
                avg = sum(recent_energy) / len(recent_energy)
                if avg <= 2:
                    insights.append({
                        "icon": "🔋",
                        "title": "Tu energía está baja",
                        "description": f"Promedio de {avg:.1f}/5 en tus últimas entradas. Considera descansar o cambiar de rutina.",
                        "type": "warning"
                    })
                elif avg >= 4:
                    insights.append({
                        "icon": "⚡",
                        "title": "Energía en su punto máximo",
                        "description": f"Promedio de {avg:.1f}/5 recientemente. ¡Aprovecha este impulso!",
                        "type": "success"
                    })

        # 5. If no insights, add a motivational one
        if not insights:
            insights.append({
                "icon": "🚀",
                "title": "¡Sigue construyendo tu historia!",
                "description": "Cada tarea, hábito y reflexión te acerca más a tus metas. FRYD está contigo.",
                "type": "info"
            })

        return insights