import json
import re
from typing import List, Dict, Optional, Any
from app.assistant.providers.registry import get_provider

SYSTEM_PROMPT = """Analiza la siguiente entrada de diario en español y extrae cualquier tarea o recordatorio que el usuario mencione que tiene pendiente o que debe realizar.
Debes responder ÚNICAMENTE con un formato JSON estructurado que sea una lista de objetos. Cada objeto debe tener exactamente los siguientes campos:
- title: Título corto y claro de la tarea (en español).
- description: Descripción de la tarea (contexto extraído del diario si existe, sino un string vacío).
- due_date: Fecha estimada en formato YYYY-MM-DD si se menciona explícitamente (ej. 'mañana', 'lunes', 'el 15 de junio'). Si no se menciona, utiliza null.

Ejemplo de respuesta esperada:
[
  {"title": "Llamar a María", "description": "Conversar sobre el presupuesto mensual", "due_date": null},
  {"title": "Entregar reporte de ventas", "description": "Preparar presentación del Q2", "due_date": "2026-06-15"}
]

No agregues explicaciones, preámbulos, ni saludos. Solo responde el JSON puro. Si no hay ninguna tarea, responde una lista vacía: []"""

class TaskExtractor:
    @staticmethod
    async def extract_tasks(
        content: str,
        provider_id: str,
        model: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if not content.strip():
            return []

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Entrada de diario:\n\"\"\"\n{content}\n\"\"\""}
        ]

        try:
            provider = get_provider(provider_id)
            response_text = await provider.generate(
                messages=messages,
                model=model,
                api_key=api_key
            )
            
            # Clean up potential markdown code block markers
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                # Remove starting ```json or ```
                cleaned = re.sub(r"^```(?:json)?", "", cleaned)
                # Remove ending ```
                cleaned = re.sub(r"```$", "", cleaned).strip()
            
            # Find the first '[' and last ']' to isolate the JSON array
            start = cleaned.find("[")
            end = cleaned.rfind("]")
            if start != -1 and end != -1:
                cleaned = cleaned[start:end+1]

            tasks = json.loads(cleaned)
            if isinstance(tasks, list):
                return tasks
            return []
        except Exception as e:
            print(f"Error in task extraction: {e}")
            return []
