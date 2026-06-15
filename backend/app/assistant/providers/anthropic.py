import httpx

from .base import AIProvider


class AnthropicProvider(AIProvider):
    """Provider for Anthropic API (Claude models)."""

    BASE_URL = "https://api.anthropic.com/v1"

    @property
    def provider_id(self) -> str:
        return "anthropic"

    @property
    def name(self) -> str:
        return "Anthropic"

    @property
    def description(self) -> str:
        return "Claude y otros modelos de Anthropic"

    @property
    def requires_api_key(self) -> bool:
        return True

    @property
    def is_local(self) -> bool:
        return False

    @property
    def available_models(self) -> list[str]:
        return ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"]

    async def generate(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ) -> str:
        if not api_key:
            raise ValueError("Anthropic requiere una API key.")

        selected_model = model or "claude-sonnet-4-20250514"

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        system_prompt, clean_messages = self._extract_system_prompt(messages)

        payload = {
            "model": selected_model,
            "max_tokens": 1024,
            "system": system_prompt,
            "messages": clean_messages,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.BASE_URL}/messages",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            content_blocks = data.get("content", [])
            return content_blocks[0].get("text", "Sin respuesta.") if content_blocks else "Sin respuesta."

    async def generate_stream(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ):
        if not api_key:
            raise ValueError("Anthropic requiere una API key.")

        selected_model = model or "claude-sonnet-4-20250514"

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        system_prompt, clean_messages = self._extract_system_prompt(messages)

        payload = {
            "model": selected_model,
            "max_tokens": 1024,
            "system": system_prompt,
            "messages": clean_messages,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{self.BASE_URL}/messages",
                headers=headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        import json
                        try:
                            data = json.loads(data_str)
                            if data.get("type") == "content_block_delta":
                                text = data.get("delta", {}).get("text", "")
                                if text:
                                    yield text
                        except (json.JSONDecodeError, KeyError):
                            continue

    async def test_connection(
        self,
        model: str | None = None,
        api_key: str | None = None,
    ) -> tuple[bool, str]:
        if not api_key:
            return (False, "Se requiere una API key para Anthropic.")

        try:
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            }
            payload = {
                "model": model or "claude-sonnet-4-20250514",
                "max_tokens": 10,
                "messages": [{"role": "user", "content": "test"}],
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/messages",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                return (True, "Conexión exitosa con Anthropic.")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return (False, "API key inválida para Anthropic.")
            return (False, f"Error de Anthropic: {e.response.status_code}")
        except Exception as e:
            return (False, f"Error al conectar con Anthropic: {str(e)}")
