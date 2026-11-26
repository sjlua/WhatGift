import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.routers import admin, auth, families, items
from app.models import Item
from app.scraper import sanitize_url, scrape_opengraph_metadata


async def rescan_missing_startup_images():
    """Backfill missing images after a backend restart or deployment."""
    db = SessionLocal()
    try:
        missing_items = (
            db.query(Item)
            .filter(
                Item.is_archived.is_(False),
                Item.image_url.is_(None),
                or_(Item.url.isnot(None), Item.alt_url.isnot(None)),
            )
            .all()
        )
        updated = 0
        for item in missing_items:
            source_url = item.url or item.alt_url
            if not source_url:
                continue
            try:
                result = await scrape_opengraph_metadata(source_url)
                image_url = result.get("image_url")
                if image_url:
                    item.image_url = sanitize_url(image_url)
                    updated += 1
            except Exception:
                continue
        if updated:
            db.commit()
    finally:
        db.close()


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
    asyncio.create_task(rescan_missing_startup_images())
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.5.0",
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
