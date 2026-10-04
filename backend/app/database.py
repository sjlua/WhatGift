from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# SQLite database file stored in backend directory
DATABASE_URL = "sqlite:///./whatgift.db"

# connect_args={"check_same_thread": False} is required for SQLite with multi-threaded frameworks like FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Crucial SQLite Configuration: SQLite disables foreign key enforcement by default.
# We explicitly enable PRAGMA foreign_keys = ON on every connection to preserve relational integrity.
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and ensures it closes cleanly."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
