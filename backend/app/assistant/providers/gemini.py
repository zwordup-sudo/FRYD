import httpx

from .base import AIProvider


class GeminiProvider(AIProvider):
    """Provider for Google Gemini API."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    @property
    def provider_id(self) -> str:
        return "gemini"

    @property
    def name(self) -> str:
        return "Google Gemini"

    @property
    def description(self) -> str:
        return "Gemini Pro y otros modelos de Google"

    @property
    def requires_api_key(self) -> bool:
        return True

    @property
    def is_local(self) -> bool:
        return False

    @property
    def available_models(self) -> list[str]:
        return ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"]

    async def generate(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ) -> str:
        if not api_key:
            raise ValueError("Google Gemini requiere una API key.")

        selected_model = model or "gemini-2.0-flash"

        system_prompt, clean_messages = self._extract_system_prompt(messages)

        # Convert messages to Gemini format
        contents = []
        for msg in clean_messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}],
            })

        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": system_prompt}],
            },
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
            },
        }

        url = f"{self.BASE_URL}/models/{selected_model}:generateContent?key={api_key}"

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                return parts[0].get("text", "Sin respuesta.") if parts else "Sin respuesta."
            return "Sin respuesta del modelo."

    async def test_connection(
        self,
        model: str | None = None,
        api_key: str | None = None,
    ) -> tuple[bool, str]:
        if not api_key:
            return (False, "Se requiere una API key para Google Gemini.")

        try:
            selected_model = model or "gemini-2.0-flash"
            url = f"{self.BASE_URL}/models/{selected_model}?key={api_key}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return (True, "Conexión exitosa con Google Gemini.")
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (401, 403):
                return (False, "API key inválida para Google Gemini.")
            return (False, f"Error de Gemini: {e.response.status_code}")
        except Exception as e:
            return (False, f"Error al conectar con Google Gemini: {str(e)}")
