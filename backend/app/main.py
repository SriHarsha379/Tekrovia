from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

# Import models once so SQLModel/Alembic metadata is populated at startup.
import app.models  # noqa: F401

from app.routers import auth, candidates, health, leads

settings = get_settings()

app = FastAPI(
    title="TekRovia API",
    description="Learning-to-Placement platform backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(candidates.router)
