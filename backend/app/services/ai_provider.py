import os
from typing import Protocol


class AIProvider(Protocol):
    def generate_text(self, prompt: str) -> str:
        ...


class LocalProvider:
    def __init__(self) -> None:
        self.provider_name = "local"

    def generate_text(self, prompt: str) -> str:
        return f"Local deterministic response for: {prompt[:120]}"


class PlaceholderProvider:
    def __init__(self) -> None:
        self.provider_name = "placeholder"

    def generate_text(self, prompt: str) -> str:
        return "AI provider not configured. Falling back to local deterministic logic."


def get_ai_provider() -> AIProvider:
    provider_name = (os.getenv("AI_PROVIDER") or "local").lower()
    if provider_name == "openai":
        return PlaceholderProvider()
    if provider_name == "nvidia":
        return PlaceholderProvider()
    return LocalProvider()
