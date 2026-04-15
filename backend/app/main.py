from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base, SessionLocal
from . import models
from .routers import auth as auth_router, babies as babies_router, feed_templates as feed_templates_router, nutrition as nutrition_router, targets as targets_router
from sqlalchemy import text
from .auth import get_password_hash

# Create database tables
Base.metadata.create_all(bind=engine)

# Robust migration for adding new columns conditionally
def safe_add_column(table: str, col: str, col_type: str, default: str = None):
    with engine.begin() as conn:
        # PostgreSQL supports 'IF NOT EXISTS'
        try:
            default_sql = f" DEFAULT {default}" if default is not None else ""
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}{default_sql}"))
        except Exception:
            # Fallback for SQLite which doesn't support 'IF NOT EXISTS'
            try:
                default_sql = f" DEFAULT {default}" if default is not None else ""
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}{default_sql}"))
            except Exception:
                pass # Already exists or other error

# 1. target_settings migrations
safe_add_column("target_settings", "fat_per_kg", "FLOAT", "0")
for col in [
    "calories_per_kg_max", "protein_per_kg_max", "fat_per_kg_max", "sodium_per_kg_max",
    "potassium_per_kg_max", "calcium_per_kg_max", "phosphorous_per_kg_max", "iron_per_kg_max",
    "zinc_per_kg_max", "vitamin_a_per_kg_max", "vitamin_d_per_kg_max", "vitamin_c_per_kg_max",
    "folic_acid_per_kg_max", "vitamin_b12_per_kg_max", "magnesium_per_kg_max",
    "dha_per_kg", "dha_per_kg_max"
]:
    safe_add_column("target_settings", col, "FLOAT")

# 2. dha migrations for other tables
safe_add_column("feed_templates", "dha", "FLOAT", "0")
safe_add_column("nutrition_logs", "dha", "FLOAT", "0")

# Auto-seed admin user if not exists
def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == "admin@nicu.com").first()
        if not existing:
            admin = models.User(
                name="Admin Doctor",
                email="admin@nicu.com",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("✅ Admin user created: admin@nicu.com / admin123")
        else:
            print("✅ Admin user already exists.")
    except Exception as e:
        print(f"❌ Seed error: {e}")
    finally:
        db.close()

seed_admin()

app = FastAPI(title="NICU Nutrition Tracking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8081",
        "http://localhost:8000",
        "https://nicu-app.vercel.app"
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
