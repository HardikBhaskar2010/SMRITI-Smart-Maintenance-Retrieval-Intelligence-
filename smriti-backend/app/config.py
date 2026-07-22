from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # ── Phase 2 Model Routing ─────────────────────────────────────────
    # Primary: Gemini 2.0 Flash — fastest, 1M ctx, multilingual, free
    QUERY_MODEL: str = "google/gemini-2.0-flash-exp:free"
    # Extraction: Gemini Flash 8B — lightweight, JSON-precise, low latency
    EXTRACTION_MODEL: str = "google/gemini-flash-1.5-8b:free"
    # Fallback: Llama 3.3 70B — proven Hinglish, if Gemini quota exhausted
    QUERY_FALLBACK_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    # Secondary fallback: Laguna XS.2
    QUERY_FALLBACK_2_MODEL: str = "poolside/laguna-xs2:free"

    CHROMA_PERSIST_DIR: str = "./data/chromadb"
    UPLOAD_DIR: str = "./data/uploads"
    SESSION_DIR: str = "./data/sessions"
    ANALYTICS_DB_PATH: str = "./data/analytics.db"
    PORT: int = 8000

    # JWT Auth (Phase 2)
    JWT_SECRET_KEY: str = "smriti-phase2-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480  # 8 hours

    # Alert monitor interval (seconds)
    ALERT_POLL_INTERVAL_SECONDS: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
