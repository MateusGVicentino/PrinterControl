from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import create_db_and_tables
from app.routes import auth, printers, alerts, collect

app = FastAPI(title="Printer Control API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar banco de dados
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    print("[OK] Database initialized")


# Rotas
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(printers.router, prefix=settings.api_prefix)
app.include_router(alerts.router, prefix=settings.api_prefix)
app.include_router(collect.router, prefix=settings.api_prefix)


@app.get("/")
def read_root():
    return {"message": "Printer Control API - Backend"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
