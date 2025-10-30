from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List


class Settings(BaseSettings):
    secret_key: str = "change_me"
    access_token_expire_minutes: int = 60 * 24 * 30
    # Example: mongodb://localhost:27017/patterncrafter
    database_url: str = "mongodb://localhost:27017/patterncrafter"
    cors_origins: List[AnyHttpUrl] | List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ]

    class Config:
        env_prefix = ""
        env_file = [".env", ".env.local"]
        case_sensitive = False


settings = Settings(
    _env_file=[".env", ".env.local"],
    _env_file_encoding="utf-8",
)
