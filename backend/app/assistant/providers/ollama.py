import httpx

from .base import AIProvider


class OllamaProvider(AIProvider):
    """Provider for Ollama local LLM server."""

    BASE_URL = "http://localhost:11434"

    @property
    def provider_id(self) -> str:
        return "ollama"

    @property
    def name(self) -> str:
        return "Ollama (Local)"

    @property
    def description(self) -> str:
        return "Modelo de IA local ejecutado con Ollama"

    @property
    def requires_api_key(self) -> bool:
        return False

    @property
    def is_local(self) -> bool:
        return True

    @property
    def available_models(self) -> list[str]:
        return ["qwen2.5-coder:14b", "qwen3:8b", "qwen3:14b", "devstral:24b"]

    async def generate(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ) -> str:
        selected_model = model or "qwen2.5-coder:14b"

        system_prompt, clean_messages = self._extract_system_prompt(messages)

        # Prepend system prompt
        full_messages = [
            {"role": "system", "content": system_prompt},
            *clean_messages,
        ]

        payload = {
            "model": selected_model,
            "messages": full_messages,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.BASE_URL}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "Sin respuesta del modelo.")

    async def generate_stream(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ):
        selected_model = model or "qwen2.5-coder:14b"
        system_prompt, clean_messages = self._extract_system_prompt(messages)

        full_messages = [
            {"role": "system", "content": system_prompt},
            *clean_messages,
        ]

        payload = {
            "model": selected_model,
            "messages": full_messages,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.BASE_URL}/api/chat",
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        import json
                        try:
                            data = json.loads(line)
                            content = data.get("message", {}).get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    async def test_connection(
        self,
        model: str | None = None,
        api_key: str | None = None,
    ) -> tuple[bool, str]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.BASE_URL}/api/tags")
                response.raise_for_status()
                data = response.json()
                model_names = [m.get("name", "") for m in data.get("models", [])]
                return (
                    True,
                    f"Conectado a Ollama. Modelos disponibles: {', '.join(model_names) or 'ninguno'}",
                )
        except httpx.ConnectError:
            return (False, "No se pudo conectar a Ollama. ¿Está ejecutándose en localhost:11434?")
        except Exception as e:
            return (False, f"Error al conectar con Ollama: {str(e)}")
