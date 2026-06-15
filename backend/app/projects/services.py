import secrets
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.users.models import User
from .models import Project, ProjectMember, ProjectTask, ProjectTaskCompletion, ProjectFeedMessage
from .schemas import ProjectCreate, ProjectTaskCreate, ProjectTaskUpdate, ProjectFeedMessageCreate

class ProjectService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def _get_user_name(self, user_id: int) -> str:
        user = self.db.query(User).filter(User.id == user_id).first()
        return user.username if user else "Usuario"

    def _check_membership(self, project_id: int) -> ProjectMember:
        member = (
            self.db.query(ProjectMember)
            .filter(ProjectMember.project_id == project_id, ProjectMember.user_id == self.user_id)
            .first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este proyecto. Debes unirte primero."
            )
        return member

    # --- Projects ---

    def create_project(self, data: ProjectCreate) -> Project:
        # Generate a unique invite code
        invite_code = secrets.token_hex(4).upper() # 8 character code
        
        # Methodology default columns
        columns = "Por hacer,En progreso,QA,Completado"
        if data.methodology == "scrum":
            columns = "Backlog,Por hacer,En progreso,QA,Finalizado"
        elif data.methodology == "waterfall":
            columns = "Requisitos,Diseño,Implementación,Pruebas,Cerrado"
        elif data.methodology == "lean":
            columns = "Por hacer,En progreso,Completado"
        
        if data.custom_columns:
            columns = data.custom_columns

        project = Project(
            name=data.name,
            description=data.description,
            methodology=data.methodology or "kanban",
            custom_columns=columns,
            invite_code=invite_code,
            owner_id=self.user_id
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)

        # Register creator as owner member
        member = ProjectMember(
            project_id=project.id,
            user_id=self.user_id,
            role="owner"
        )
        self.db.add(member)
        
        # Post initial feed message
        username = self._get_user_name(self.user_id)
        welcome_message = ProjectFeedMessage(
            project_id=project.id,
            user_id=self.user_id,
            content=f"💼 ¡El proyecto '{project.name}' ha sido creado por {username} con metodología {project.methodology.upper()}!",
            is_achievement=True
        )
        self.db.add(welcome_message)
        
        self.db.commit()
        self.db.refresh(project)
        return project

    def join_project(self, invite_code: str) -> Project:
        project = self.db.query(Project).filter(Project.invite_code == invite_code.upper()).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Código de invitación no válido o proyecto no encontrado."
            )

        # Check if already a member
        existing = (
            self.db.query(ProjectMember)
            .filter(ProjectMember.project_id == project.id, ProjectMember.user_id == self.user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya eres miembro de este proyecto."
            )

        # Create member
        member = ProjectMember(
            project_id=project.id,
            user_id=self.user_id,
            role="member"
        )
        self.db.add(member)

        # Feed alert
        username = self._get_user_name(self.user_id)
        alert = ProjectFeedMessage(
            project_id=project.id,
            user_id=self.user_id,
            content=f"👋 ¡{username} se ha unido al proyecto! ¡Démosle la bienvenida!",
            is_achievement=True
        )
        self.db.add(alert)
        
        self.db.commit()
        self.db.refresh(project)
        return project

    def get_my_projects(self) -> list[dict]:
        memberships = (
            self.db.query(ProjectMember)
            .filter(ProjectMember.user_id == self.user_id)
            .all()
        )
        projects_data = []
        for m in memberships:
            project = m.project
            # Calculate general progress in tasks
            total_tasks = self.db.query(ProjectTask).filter(ProjectTask.project_id == project.id).count()
            
            # Tasks completed: either column is 'Completado'/'Finalizado'/'Cerrado' or has completion record
            completed_tasks = (
                self.db.query(ProjectTaskCompletion)
                .join(ProjectTask)
                .filter(ProjectTask.project_id == project.id, ProjectTaskCompletion.user_id == self.user_id)
                .count()
            )
            
            progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Points earned by current user in this project
            points_earned = (
                self.db.query(func.sum(ProjectTask.xp_reward))
                .join(ProjectTaskCompletion)
                .filter(ProjectTask.project_id == project.id, ProjectTaskCompletion.user_id == self.user_id)
                .scalar()
            ) or 0
            
            # Member count
            member_count = self.db.query(ProjectMember).filter(ProjectMember.project_id == project.id).count()

            projects_data.append({
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "methodology": project.methodology,
                "custom_columns": project.custom_columns,
                "invite_code": project.invite_code,
                "owner_id": project.owner_id,
                "created_at": project.created_at,
                "role": m.role,
                "points_earned": points_earned,
                "member_count": member_count,
                "task_progress": round(progress, 1)
            })
        return projects_data

    def get_project_details(self, project_id: int) -> dict:
        project = self.db.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
        member = self._check_membership(project_id)
        
        # Calculate points earned by current user in this project
        points_earned = (
            self.db.query(func.sum(ProjectTask.xp_reward))
            .join(ProjectTaskCompletion)
            .filter(ProjectTask.project_id == project_id, ProjectTaskCompletion.user_id == self.user_id)
            .scalar()
        ) or 0
        
        member_count = self.db.query(ProjectMember).filter(ProjectMember.project_id == project_id).count()

        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "methodology": project.methodology,
            "custom_columns": project.custom_columns,
            "invite_code": project.invite_code,
            "owner_id": project.owner_id,
            "created_at": project.created_at,
            "my_role": member.role,
            "my_points": points_earned,
            "member_count": member_count
        }

    # --- Leaderboard ---

    def get_leaderboard(self, project_id: int) -> list[dict]:
        self._check_membership(project_id)
        members = (
            self.db.query(ProjectMember)
            .filter(ProjectMember.project_id == project_id)
            .all()
        )
        
        leaderboard = []
        for m in members:
            username = self._get_user_name(m.user_id)
            # Calculate points earned
            points_earned = (
                self.db.query(func.sum(ProjectTask.xp_reward))
                .join(ProjectTaskCompletion)
                .filter(ProjectTask.project_id == project_id, ProjectTaskCompletion.user_id == m.user_id)
                .scalar()
            ) or 0

            leaderboard.append({
                "project_id": project_id,
                "user_id": m.user_id,
                "username": username,
                "role": m.role,
                "points_earned": points_earned,
                "joined_at": m.joined_at
            })
        
        # Sort by points desc
        leaderboard.sort(key=lambda x: x["points_earned"], reverse=True)
        return leaderboard

    # --- Tasks ---

    def create_project_task(self, project_id: int, data: ProjectTaskCreate) -> ProjectTask:
        self._check_membership(project_id)

        task = ProjectTask(
            project_id=project_id,
            title=data.title,
            description=data.description,
            column_name=data.column_name or "Por hacer",
            assigned_to=data.assigned_to,
            story_points=data.story_points or 1,
            xp_reward=data.xp_reward or 15,
            due_date=data.due_date
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)

        # Notify feed
        alert = ProjectFeedMessage(
            project_id=project_id,
            user_id=self.user_id,
            content=f"🎯 Nueva tarea agregada: **{task.title}** en columna '{task.column_name}' | XP: +{task.xp_reward}",
            is_achievement=True
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(task)
        
        return task

    def update_project_task(self, task_id: int, data: ProjectTaskUpdate) -> ProjectTask:
        task = self.db.get(ProjectTask, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Tarea no encontrada.")
        
        self._check_membership(task.project_id)

        # Check if column is changing
        col_changed = data.column_name is not None and data.column_name != task.column_name

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.column_name is not None:
            task.column_name = data.column_name
        if data.assigned_to is not None:
            task.assigned_to = data.assigned_to
        if data.story_points is not None:
            task.story_points = data.story_points
        if data.xp_reward is not None:
            task.xp_reward = data.xp_reward
        if data.due_date is not None:
            task.due_date = data.due_date

        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)

        # Notify feed on column change (drag and drop indicator)
        if col_changed:
            username = self._get_user_name(self.user_id)
            alert = ProjectFeedMessage(
                project_id=task.project_id,
                user_id=self.user_id,
                content=f"🔄 {username} movió la tarea **{task.title}** a la columna '{task.column_name}'",
                is_achievement=False
            )
            self.db.add(alert)
            self.db.commit()

        return task

    def get_project_tasks(self, project_id: int) -> list[dict]:
        self._check_membership(project_id)
        tasks = self.db.query(ProjectTask).filter(ProjectTask.project_id == project_id).all()
        
        result = []
        for t in tasks:
            completion = (
                self.db.query(ProjectTaskCompletion)
                .filter(ProjectTaskCompletion.project_task_id == t.id)
                .first()
            )
            is_completed = completion is not None
            completed_at = completion.completed_at if completion else None
            
            assignee_username = None
            if t.assigned_to:
                assignee_username = self._get_user_name(t.assigned_to)

            result.append({
                "id": t.id,
                "project_id": t.project_id,
                "title": t.title,
                "description": t.description,
                "column_name": t.column_name,
                "assigned_to": t.assigned_to,
                "assignee_username": assignee_username,
                "story_points": t.story_points,
                "xp_reward": t.xp_reward,
                "due_date": t.due_date,
                "completed": is_completed,
                "completed_at": completed_at,
                "created_at": t.created_at
            })
        return result

    def complete_project_task(self, task_id: int) -> ProjectTaskCompletion:
        task = self.db.get(ProjectTask, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Tarea no encontrada.")
        
        self._check_membership(task.project_id)

        # Check if already completed
        existing = (
            self.db.query(ProjectTaskCompletion)
            .filter(ProjectTaskCompletion.project_task_id == task_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta tarea ya ha sido completada."
            )

        # Create completion record
        completion = ProjectTaskCompletion(
            project_task_id=task_id,
            user_id=self.user_id
        )
        self.db.add(completion)

        # Update column to completed
        project = task.project
        cols = project.custom_columns.split(",")
        last_col = cols[-1] if cols else "Completado"
        task.column_name = last_col

        # Feed alert
        username = self._get_user_name(self.user_id)
        alert = ProjectFeedMessage(
            project_id=task.project_id,
            user_id=self.user_id,
            content=f"✅ ¡{username} completó la tarea **{task.title}**! (+{task.xp_reward} XP)",
            is_achievement=True
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(completion)
        
        return completion

    # --- Feed Messages ---

    def get_feed_messages(self, project_id: int) -> list[dict]:
        self._check_membership(project_id)
        messages = (
            self.db.query(ProjectFeedMessage)
            .filter(ProjectFeedMessage.project_id == project_id)
            .order_by(ProjectFeedMessage.created_at.desc())
            .limit(50)
            .all()
        )
        
        result = []
        for msg in messages:
            result.append({
                "id": msg.id,
                "project_id": msg.project_id,
                "user_id": msg.user_id,
                "username": self._get_user_name(msg.user_id),
                "content": msg.content,
                "is_achievement": msg.is_achievement,
                "created_at": msg.created_at
            })
        return result

    def post_feed_message(self, project_id: int, data: ProjectFeedMessageCreate) -> ProjectFeedMessage:
        self._check_membership(project_id)
        
        msg = ProjectFeedMessage(
            project_id=project_id,
            user_id=self.user_id,
            content=data.content,
            is_achievement=False
        )
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        
        return msg

    def get_project_analytics(self, project_id: int) -> dict:
        self._check_membership(project_id)
        
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
            
        tasks = self.db.query(ProjectTask).filter(ProjectTask.project_id == project_id).all()
        total_tasks = len(tasks)
        
        completed_tasks = [t for t in tasks if t.completions]
        completed_tasks_count = len(completed_tasks)
        pending_tasks_count = total_tasks - completed_tasks_count
        
        total_sp = sum(t.story_points for t in tasks if t.story_points)
        completed_sp = sum(t.story_points for t in completed_tasks if t.story_points)
        
        members = self.db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
        active_members_count = len(members)
        
        # Calculate Flow Health Score
        flow_health = 100
        now = datetime.utcnow()
        
        # 1. Overdue tasks deduction (tasks not completed with due date in the past)
        overdue_tasks = []
        for t in tasks:
            if t.due_date and t.due_date < now and not t.completions:
                overdue_tasks.append(t)
        flow_health -= min(len(overdue_tasks) * 10, 40)
        
        # 2. WIP Limit Exceeded deduction (more than 3 tasks in "En progreso")
        in_progress_count = self.db.query(ProjectTask).filter(
            ProjectTask.project_id == project_id,
            ProjectTask.column_name == "En progreso"
        ).count()
        if in_progress_count > 3:
            flow_health -= 15
            
        # 3. Unassigned tasks deduction
        unassigned_tasks = [t for t in tasks if not t.assigned_to and not t.completions]
        flow_health -= min(len(unassigned_tasks) * 5, 20)
        
        # 4. High story points unassigned tasks
        high_sp_unassigned = [t for t in unassigned_tasks if t.story_points and t.story_points >= 5]
        flow_health -= min(len(high_sp_unassigned) * 10, 20)
        
        flow_health = max(flow_health, 0)
        
        # Calculate weekly productivity (last 4 weeks)
        from datetime import timedelta
        weekly_data = []
        for i in range(3, -1, -1):
            start_date = now - timedelta(days=(i+1)*7)
            end_date = now - timedelta(days=i*7)
            
            created_count = self.db.query(ProjectTask).filter(
                ProjectTask.project_id == project_id,
                ProjectTask.created_at >= start_date,
                ProjectTask.created_at < end_date
            ).count()
            
            completed_count = self.db.query(ProjectTaskCompletion).join(ProjectTask).filter(
                ProjectTask.project_id == project_id,
                ProjectTaskCompletion.completed_at >= start_date,
                ProjectTaskCompletion.completed_at < end_date
            ).count()
            
            label = f"{start_date.strftime('%d/%m')} - {end_date.strftime('%d/%m')}"
            weekly_data.append({
                "week_label": label,
                "created": created_count,
                "completed": completed_count
            })
            
        # Member contributions
        member_contribs = []
        mvp_candidate = {"username": "Ninguno", "story_points": -1}
        for m in members:
            username = self._get_user_name(m.user_id)
            comp_count = self.db.query(ProjectTaskCompletion).join(ProjectTask).filter(
                ProjectTask.project_id == project_id,
                ProjectTaskCompletion.user_id == m.user_id
            ).count()
            
            comp_tasks = self.db.query(ProjectTask).join(ProjectTaskCompletion).filter(
                ProjectTask.project_id == project_id,
                ProjectTaskCompletion.user_id == m.user_id
            ).all()
            sp_sum = sum(t.story_points for t in comp_tasks if t.story_points)
            
            member_contribs.append({
                "user_id": m.user_id,
                "username": username,
                "tasks_completed": comp_count,
                "story_points": sp_sum
            })
            
            if sp_sum > mvp_candidate["story_points"] or (sp_sum == mvp_candidate["story_points"] and comp_count > 0):
                mvp_candidate = {"username": username, "story_points": sp_sum}
                
        # Column distribution
        cols = (project.custom_columns or "Por hacer,En progreso,Completado").split(",")
        col_dist = []
        for col in cols:
            count = self.db.query(ProjectTask).filter(
                ProjectTask.project_id == project_id,
                ProjectTask.column_name == col
            ).count()
            col_dist.append({
                "name": col,
                "value": count
            })
            
        # Opportunities detailed descriptions
        opps = []
        for t in overdue_tasks:
            opps.append({
                "type": "overdue",
                "title": t.title,
                "desc": f"Tarea vencida el {t.due_date.strftime('%d/%m/%Y')}."
            })
        for t in high_sp_unassigned:
            opps.append({
                "type": "critical_unassigned",
                "title": t.title,
                "desc": f"Tarea crítica ({t.story_points} SP) sin un responsable asignado."
            })
        if in_progress_count > 3:
            opps.append({
                "type": "wip_exceeded",
                "title": "Sobrecarga en progreso",
                "desc": f"Hay {in_progress_count} tareas 'En progreso' simultáneamente. Supera el límite de 3."
            })
            
        return {
            "project_id": project.id,
            "name": project.name,
            "description": project.description,
            "methodology": project.methodology,
            "invite_code": project.invite_code,
            "owner_id": project.owner_id,
            "kpis": {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks_count,
                "pending_tasks": pending_tasks_count,
                "total_story_points": total_sp,
                "completed_story_points": completed_sp,
                "active_members": active_members_count,
                "flow_health": flow_health,
                "mvp": mvp_candidate["username"] if mvp_candidate["story_points"] >= 0 else "N/A"
            },
            "weekly_productivity": weekly_data,
            "member_contributions": member_contribs,
            "column_distribution": col_dist,
            "opportunities": opps
        }

    async def get_project_ai_coach(self, project_id: int, user: User) -> dict:
        self._check_membership(project_id)
        
        # 1. Get analytics
        analytics = self.get_project_analytics(project_id)
        
        # 2. Build prompt
        prompt = (
            f"Eres el Entrenador de IA de FRYD, un coach de productividad experto en metodologías ágiles.\n"
            f"Analiza los siguientes datos del proyecto '{analytics['name']}' (Metodología: {analytics['methodology'].upper()}):\n\n"
            f"Métricas:\n"
            f"- Tareas totales: {analytics['kpis']['total_tasks']}\n"
            f"- Tareas completadas: {analytics['kpis']['completed_tasks']}\n"
            f"- Tareas pendientes: {analytics['kpis']['pending_tasks']}\n"
            f"- Story Points totales: {analytics['kpis']['total_story_points']}\n"
            f"- Story Points completados: {analytics['kpis']['completed_story_points']}\n"
            f"- Miembros activos: {analytics['kpis']['active_members']}\n"
            f"- Índice de salud del flujo: {analytics['kpis']['flow_health']}%\n"
            f"- MVP del Sprint: {analytics['kpis']['mvp']}\n\n"
            f"Distribución de tareas por columna:\n"
        )
        for col in analytics['column_distribution']:
            prompt += f"- {col['name']}: {col['value']} tareas\n"
            
        prompt += "\nÁreas de oportunidad detectadas (Heurísticas):\n"
        if not analytics['opportunities']:
            prompt += "- Ninguna identificada automáticamente.\n"
        for opp in analytics['opportunities']:
            prompt += f"- [{opp['type']}] {opp['title']}: {opp['desc']}\n"
            
        prompt += (
            f"\nInstrucciones:\n"
            f"Genera un diagnóstico ejecutivo y constructivo en español (formato Markdown).\n"
            f"1. Evalúa el estado del proyecto y el Índice de Salud ({analytics['kpis']['flow_health']}%).\n"
            f"2. Identifica cuellos de botella clave (ej. tareas sin asignar, acumulación de WIP, tareas vencidas).\n"
            f"3. Ofrece 3 recomendaciones concretas y accionables para el equipo para mejorar la productividad en el próximo sprint.\n"
            f"4. Felicita brevemente al MVP ({analytics['kpis']['mvp']}) si aplica.\n"
            f"Sé directo, profesional, motivador y breve. No inventes datos fuera de los provistos."
        )

        from app.assistant.providers.registry import get_provider
        
        provider_name = user.ai_provider or "ollama"
        model_name = user.ai_model
        api_key = user.ai_api_key
        
        messages = [
            {"role": "system", "content": "Eres el Entrenador de IA de FRYD, un coach de productividad experto en metodologías ágiles."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            provider = get_provider(provider_name)
            response = await provider.generate(messages=messages, model=model_name, api_key=api_key)
        except Exception as e:
            # Fallback to local heuristic text if provider fails
            response = self._generate_heuristic_ai_coach_response(analytics)
            
        return {"response": response}

    def _generate_heuristic_ai_coach_response(self, analytics: dict) -> str:
        health = analytics['kpis']['flow_health']
        mvp = analytics['kpis']['mvp']
        opps = analytics['opportunities']
        
        status_text = "excelente" if health >= 80 else "regular" if health >= 50 else "crítico"
        
        response = (
            f"### 📋 Diagnóstico del Entrenador de IA (Heurístico Fallback)\n\n"
            f"El estado general de tu proyecto es **{status_text}** con un Índice de Salud de Flujo del **{health}%**.\n\n"
        )
        
        if opps:
            response += "#### ⚠️ Puntos Críticos Detectados:\n"
            for opp in opps:
                response += f"- **{opp['title']}**: {opp['desc']}\n"
            response += "\n"
        else:
            response += "✨ ¡El flujo de trabajo está impecable! No se detectaron cuellos de botella automáticos.\n\n"
            
        response += "#### 🚀 Recomendaciones:\n"
        recs = []
        if any(o['type'] == 'wip_exceeded' for o in opps):
            recs.append("1. **Limitar el WIP (Work In Progress):** Detengan la creación o el inicio de nuevas tareas hasta que las que están 'En Progreso' se completen o muevan a QA.")
        else:
            recs.append("1. **Mantener el ritmo actual:** Sigan aplicando los límites de WIP actuales para mantener el flujo constante.")
            
        if any(o['type'] == 'critical_unassigned' for o in opps):
            recs.append("2. **Asignar tareas críticas:** Asignen un responsable a las tareas pendientes con alta cantidad de Story Points para evitar retrasos en entregables clave.")
        else:
            recs.append("2. **Planificación anticipada:** Asegúrense de que las tareas del próximo sprint tengan un dueño asignado antes de iniciar.")
            
        if any(o['type'] == 'overdue' for o in opps):
            recs.append("3. **Revisión de fechas de vencimiento:** Revisen las tareas retrasadas y replanifiquen sus fechas de entrega si es necesario.")
        else:
            recs.append("3. **Revisión continua:** Sigan monitoreando las fechas límite para mantener el 100% de cumplimiento.")
            
        response += "\n".join(recs) + "\n\n"
        
        if mvp and mvp != "Ninguno" and mvp != "N/A":
            response += f"🌟 **Reconocimiento Especial:** ¡Felicitaciones a **{mvp}** por ser el MVP de este periodo con el mayor aporte en Story Points!"
            
        return response

