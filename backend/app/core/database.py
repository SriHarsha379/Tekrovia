from sqlmodel import Session, create_engine

from app.core.config import get_settings

settings = get_settings()

# echo=True is useful while learning the query patterns — turn off before prod
engine = create_engine(settings.database_url, echo=False)


def get_session():
    """FastAPI dependency — yields a DB session per request."""
    with Session(engine) as session:
        yield session
