from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./printer_control.db"

    # JWT
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_hours: int = 24

    # SNMP
    snmp_community: str = "public"
    snmp_timeout: float = 1.5
    snmp_retries: int = 1

    # Coleta simulada: habilita mode="mock" em /api/collect.
    # Deve permanecer False em producao — com ele ligado a API grava
    # leituras ficticias no banco como se fossem reais.
    allow_mock_collect: bool = False

    # Coleta
    collector_interval_seconds: int = 300  # 5 minutos

    # API
    api_prefix: str = "/api"
    cors_origins: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
