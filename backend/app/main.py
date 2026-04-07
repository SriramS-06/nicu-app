from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base
from . import models
from .routers import auth as auth_router, babies as babies_router, feed_templates as feed_templates_router, nutrition as nutrition_router, targets as targets_router
from sqlalchemy import text

# Create database tables
Base.metadata.create_all(bind=engine)

# Lightweight migration for existing SQLite DBs.
with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE target_settings ADD COLUMN fat_per_kg FLOAT NOT NULL DEFAULT 0"))
    except Exception:
        pass
    for col in [
        "calories_per_kg_max", "protein_per_kg_max", "fat_per_kg_max", "sodium_per_kg_max",
        "potassium_per_kg_max", "calcium_per_kg_max", "phosphorous_per_kg_max", "iron_per_kg_max",
        "zinc_per_kg_max", "vitamin_a_per_kg_max", "vitamin_d_per_kg_max", "vitamin_c_per_kg_max",
        "folic_acid_per_kg_max", "vitamin_b12_per_kg_max", "magnesium_per_kg_max"
    ]:
        try:
            conn.execute(text(f"ALTER TABLE target_settings ADD COLUMN {col} FLOAT"))
        except Exception:
            pass

app = FastAPI(title="NICU Nutrition Tracking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8000",
        "https://*.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(babies_router.router, prefix="/babies", tags=["babies"])
app.include_router(feed_templates_router.router, prefix="/feed-templates", tags=["feed-templates"])
app.include_router(nutrition_router.router, prefix="/nutrition", tags=["nutrition"])
app.include_router(targets_router.router, prefix="/targets", tags=["targets"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
