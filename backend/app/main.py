from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import admin, auth, families, items


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup
    Base.metadata.create_all(bind=engine)
    # Check if columns exist in existing SQLite databases
    with engine.connect() as conn:
        try:
            item_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(items)").fetchall()]
            if item_cols and "alt_url" not in item_cols:
                conn.exec_driver_sql("ALTER TABLE items ADD COLUMN alt_url VARCHAR(1024)")
                conn.commit()
            if item_cols and "is_on_sale" not in item_cols:
                conn.exec_driver_sql("ALTER TABLE items ADD COLUMN is_on_sale BOOLEAN DEFAULT 0")
                conn.commit()
            fam_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(families)").fetchall()]
            if fam_cols and "allow_item_deletion" not in fam_cols:
                conn.exec_driver_sql("ALTER TABLE families ADD COLUMN allow_item_deletion BOOLEAN DEFAULT 1")
                conn.commit()
        except Exception:
            pass
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.2.1",
    description="Mobile-friendly Family Wishlist API with privacy protection",
    lifespan=lifespan,
)

# CORS configuration supporting localhost on any port (5173, 8100, 8000, 3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(families.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(items.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
