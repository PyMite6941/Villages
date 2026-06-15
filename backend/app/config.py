from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-70b-versatile"
    secret_key: str = "change-me-in-production"
    
    class Config:
        env_file = ".env"

settings = Settings()
