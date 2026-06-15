from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Base class for all AI providers."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique identifier for this provider."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Display name for this provider."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Brief description of the provider."""
        ...

    @property
    @abstractmethod
    def requires_api_key(self) -> bool:
        """Whether this provider requires an API key."""
        ...

    @property
    @abstractmethod
    def is_local(self) -> bool:
        """Whether this provider runs locally."""
        ...

    @property
    @abstractmethod
    def available_models(self) -> list[str]:
        """List of available model names."""
        ...

    @abstractmethod
    async def generate(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ) -> str:
        """
        Generate a response from the AI model.

        Args:
            messages: List of message dicts with 'role' and 'content' keys.
            model: Optional model name override.
            api_key: Optional API key override.

        Returns:
            The generated text response.
        """
        ...

    async def generate_stream(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        api_key: str | None = None,
    ):
        """
        Generate a stream of responses from the AI model.
        Default implementation falls back to generate() and yields the response in chunks.
        """
        response = await self.generate(messages, model, api_key)
        import asyncio
        words = response.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.01)

    @abstractmethod
    async def test_connection(
        self,
        model: str | None = None,
        api_key: str | None = None,
    ) -> tuple[bool, str]:
        """
        Test whether the provider is reachable and configured correctly.

        Returns:
            Tuple of (success: bool, message: str).
        """
        ...

    def get_system_prompt(self) -> str:
        """Default system prompt for FRYD assistant."""
        return (
            "Eres FRYD, un asistente personal de productividad. "
            "Tu objetivo es ayudar al usuario a organizar sus tareas, mejorar sus hábitos, "
            "reflexionar sobre su día a día y alcanzar sus metas y objetivos. "
            "Responde siempre en español de forma clara, empática y práctica. "
            "Cuando sea posible, sugiere conexiones entre hábitos, metas y proyectos "
            "que el usuario no puede ver a simple vista. "
            "Sé conciso pero útil."
        )

    def _extract_system_prompt(self, messages: list[dict[str, str]]) -> tuple[str, list[dict[str, str]]]:
        """
        Extract custom system prompt if present, and return (system_prompt, other_messages).
        """
        system_msg = next((msg["content"] for msg in messages if msg.get("role") == "system"), None)
        other_messages = [msg for msg in messages if msg.get("role") != "system"]
        return system_msg or self.get_system_prompt(), other_messages
