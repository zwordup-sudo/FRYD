import httpx

from .base import AIProvider


class OpenAIProvider(AIProvider):
    """Provider for OpenAI API (GPT models)."""

    BASE_URL = "https://api.openai.com/v1"

    @property
    def provider_id(self) -> str:
        return "openai"

    @property
    def name(self) -> str:
        return "OpenAI"

    @property
    def description(self) -> str:
        return "GPT-4, GPT-3.5 y más modelos de OpenAI"

    @property
    def requires_api_key(self) -> bool:
        return True

    @property
    def is_local(self) -> bool:
        return False

    @property
    def available_models(self) -> list[str]:
        return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]

    async def generate(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ) -> str:
        if not api_key:
            raise ValueError("OpenAI requiere una API key.")

        selected_model = model or "gpt-4o-mini"

        system_prompt, clean_messages = self._extract_system_prompt(messages)

        full_messages = [
            {"role": "system", "content": system_prompt},
            *clean_messages,
        ]

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": selected_model,
            "messages": full_messages,
            "temperature": 0.7,
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def generate_stream(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ):
        if not api_key:
            raise ValueError("OpenAI requiere una API key.")

        selected_model = model or "gpt-4o-mini"
        system_prompt, clean_messages = self._extract_system_prompt(messages)

        full_messages = [
            {"role": "system", "content": system_prompt},
            *clean_messages,
        ]

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": selected_model,
            "messages": full_messages,
            "temperature": 0.7,
            "max_tokens": 1024,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{self.BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        import json
                        try:
                            data = json.loads(data_str)
                            content = data["choices"][0]["delta"].get("content", "")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

    async def test_connection(
        self,
        model: str | None = None,
        api_key: str | None = None,
    ) -> tuple[bool, str]:
        if not api_key:
            return (False, "Se requiere una API key para OpenAI.")

        try:
            headers = {"Authorization": f"Bearer {api_key}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.BASE_URL}/models",
                    headers=headers,
                )
                response.raise_for_status()
                return (True, "Conexión exitosa con OpenAI.")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return (False, "API key inválida para OpenAI.")
            return (False, f"Error de OpenAI: {e.response.status_code}")
        except Exception as e:
            return (False, f"Error al conectar con OpenAI: {str(e)}")
