from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    openrouter_api_key: str = ""
    openrouter_model: str = "meta-llama/llama-3.3-70b-instruct:free"
    openrouter_model_fallback: str = "google/gemma-4-31b-it:free"

    # Comma-separated list of allowed CORS origins for the deployed frontend,
    # e.g. "https://villages-abc.vercel.app,https://villages.app".
    # Vercel preview deploys (*.vercel.app) are matched separately via regex.
    frontend_origins: str = ""

    class Config:
        env_file = ".env"

    @property
    def cors_origins(self) -> list[str]:
        base = ["http://localhost:5173", "http://localhost:4173"]
        extra = [o.strip() for o in self.frontend_origins.split(",") if o.strip()]
        return base + extra

    @property
    def frontend_url(self) -> str:
        """Production frontend URL for magic-link redirects, falls back to localhost."""
        extra = [o.strip() for o in self.frontend_origins.split(",") if o.strip()]
        return extra[0] if extra else "http://localhost:5173"

settings = Settings()
