from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CareerPilot AI"
    app_env: str = "development"
    frontend_url: str = "http://localhost:3000"
    database_url: str = "sqlite:///./careerpilot.db"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    openai_api_key: str = ""
    ai_provider: str = "local"
    ai_model: str = "local"
    ai_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
