from .base import AIProvider
from .ollama import OllamaProvider
from .openai import OpenAIProvider
from .anthropic import AnthropicProvider
from .gemini import GeminiProvider

from app.assistant.schemas import ProviderInfo


# Registry of all available providers
_PROVIDERS: dict[str, AIProvider] = {
    "ollama": OllamaProvider(),
    "openai": OpenAIProvider(),
    "anthropic": AnthropicProvider(),
    "gemini": GeminiProvider(),
}


def get_provider(provider_id: str) -> AIProvider:
    """Get a provider by its ID."""
    provider = _PROVIDERS.get(provider_id)
    if not provider:
        raise ValueError(f"Proveedor '{provider_id}' no encontrado. Disponibles: {list(_PROVIDERS.keys())}")
    return provider


def list_providers() -> list[ProviderInfo]:
    """List all available providers with their info."""
    return [
        ProviderInfo(
            id=p.provider_id,
            name=p.name,
            description=p.description,
            requires_api_key=p.requires_api_key,
            available_models=p.available_models,
            is_local=p.is_local,
        )
        for p in _PROVIDERS.values()
    ]
