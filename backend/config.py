import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    API_KEY: str = os.getenv("API_KEY", "")
    FMCSA_API_KEY: str = os.getenv("FMCSA_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    CORS_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    ]
    RATE_LIMIT: str = "100/minute"


settings = Settings()
