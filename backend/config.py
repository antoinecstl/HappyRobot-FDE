import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    API_KEY: str = os.getenv("API_KEY", "")
    FMCSA_API_KEY: str = os.getenv("FMCSA_API_KEY", "")
    _raw_db_url: str = os.getenv("DATABASE_URL", "")
    # Auto-fix: ensure asyncpg driver even if URL starts with plain postgresql://
    DATABASE_URL: str = _raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1) if _raw_db_url and "asyncpg" not in _raw_db_url else _raw_db_url
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    ]
    RATE_LIMIT: str = "100/minute"


settings = Settings()
