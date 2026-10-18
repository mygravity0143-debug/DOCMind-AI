import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocMind AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/docmind.db")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "docmind_secret_super_secure_key_change_in_prod_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # File uploads & storage
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    VECTOR_DIR: Path = BASE_DIR / "vector_indices"
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list[str] = [".pdf"]

    # AI & LLM settings
    DEFAULT_LLM_PROVIDER: str = "gemini"  # "gemini", "openai", "offline"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # RAG Settings
    CHUNK_SIZE: int = 700
    CHUNK_OVERLAP: int = 150
    TOP_K_CHUNKS: int = 5

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.VECTOR_DIR.mkdir(parents=True, exist_ok=True)
