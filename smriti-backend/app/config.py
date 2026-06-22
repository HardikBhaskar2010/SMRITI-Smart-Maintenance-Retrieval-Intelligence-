from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Two-model routing strategy — all $0 on OpenRouter free tier
    # Extraction: code-trained → strongest JSON-only instruction adherence
    EXTRACTION_MODEL: str = "cohere/north-mini-code:free"
    # Query + Guru: proven multilingual (Hindi / Hinglish / English)
    QUERY_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    # Fallback: 102B, 1098ms published median — reliable if Llama 3.3 rate-limits
    QUERY_FALLBACK_MODEL: str = "poolside/laguna-xs2:free"

    CHROMA_PERSIST_DIR: str = "./data/chromadb"
    UPLOAD_DIR: str = "./data/uploads"
    SESSION_DIR: str = "./data/sessions"
    PORT: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
