from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base, SessionLocal
from . import models, auth
from .routers import auth as auth_router, babies as babies_router, feed_templates as feed_templates_router, nutrition as nutrition_router, targets as targets_router
from .routers.targets import ESPGHAN_2022_DEFAULTS, TOTAL_DAY_NUTRIENTS
from sqlalchemy import text
from .auth import get_password_hash

# Create database tables
Base.metadata.create_all(bind=engine)

# Robust migration for adding new columns conditionally
def safe_add_column(table: str, col: str, col_type: str, default: str = None):
    with engine.begin() as conn:
        try:
            default_sql = f" DEFAULT {default}" if default is not None else ""
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}{default_sql}"))
        except Exception:
            try:
                default_sql = f" DEFAULT {default}" if default is not None else ""
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}{default_sql}"))
            except Exception:
                pass

# 1. target_settings migrations
safe_add_column("target_settings", "fat_per_kg", "FLOAT", "0")
for col in [
    "calories_per_kg_max", "protein_per_kg_max", "fat_per_kg_max", "sodium_per_kg_max",
    "potassium_per_kg_max", "calcium_per_kg_max", "phosphorous_per_kg_max", "iron_per_kg_max",
    "zinc_per_kg_max", "vitamin_a_per_kg_max", "vitamin_d_per_kg_max", "vitamin_c_per_kg_max",
    "folic_acid_per_kg_max", "vitamin_b12_per_kg_max", "magnesium_per_kg_max",
    "dha_per_kg", "dha_per_kg_max",
    "vitamin_e_per_kg_max"
]:
    safe_add_column("target_settings", col, "FLOAT")

safe_add_column("target_settings", "vitamin_e_per_kg", "FLOAT", "0")

# 2. dha and vitamin_e migrations for other tables
safe_add_column("feed_templates", "dha", "FLOAT", "0")
safe_add_column("feed_templates", "vitamin_e", "FLOAT", "0")
safe_add_column("nutrition_logs", "dha", "FLOAT", "0")
safe_add_column("nutrition_logs", "vitamin_e", "FLOAT", "0")

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

# ---------------------------------------------------------------------------
# Register /targets/default/espghan BEFORE including the targets router.
# This guarantees it is never shadowed by the /{target_id} dynamic route.
# ---------------------------------------------------------------------------
@app.get("/targets/default/espghan", tags=["targets"])
def get_espghan_defaults_top(current_user: models.User = Depends(auth.get_current_user)):
    """Return the ESPGHAN 2022 Enteral guideline defaults and metadata."""
    return {
        "targets": ESPGHAN_2022_DEFAULTS,
        "total_day_nutrients": TOTAL_DAY_NUTRIENTS,
        "note": "Zinc and Vitamin D targets are total per day. All others are per kg/day.",
    }

# ---------------------------------------------------------------------------
# Register /targets/baby/{baby_id}/daily BEFORE including the targets router.
# ---------------------------------------------------------------------------
from sqlalchemy.orm import Session
from .db import get_db

@app.get("/targets/baby/{baby_id}/daily", tags=["targets"])
def get_daily_target_top(
    baby_id: int,
    day_of_life: int,
    weight: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # 1. Try baby-specific target
    target = (
        db.query(models.TargetSetting)
        .filter(
            models.TargetSetting.baby_id == baby_id,
            models.TargetSetting.min_day_of_life <= day_of_life,
            models.TargetSetting.max_day_of_life >= day_of_life,
            models.TargetSetting.weight_range_min <= weight,
            models.TargetSetting.weight_range_max >= weight,
        )
        .order_by(models.TargetSetting.id.desc())
        .first()
    )
    if target:
        return target

    # 2. Try global target (baby_id is NULL)
    target = (
        db.query(models.TargetSetting)
        .filter(
            models.TargetSetting.baby_id == None,
            models.TargetSetting.min_day_of_life <= day_of_life,
            models.TargetSetting.max_day_of_life >= day_of_life,
            models.TargetSetting.weight_range_min <= weight,
            models.TargetSetting.weight_range_max >= weight,
        )
        .order_by(models.TargetSetting.id.desc())
        .first()
    )
    if target:
        return target

    # 3. Fall back to ESPGHAN 2022 defaults
    return {
        "id": 0,
        "baby_id": None,
        "min_day_of_life": 0,
        "max_day_of_life": 9999,
        "weight_range_min": 0.0,
        "weight_range_max": 100.0,
        **ESPGHAN_2022_DEFAULTS,
        "total_day_nutrients": TOTAL_DAY_NUTRIENTS,
    }

# Include routers AFTER the explicit routes above
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(babies_router.router, prefix="/babies", tags=["babies"])
app.include_router(feed_templates_router.router, prefix="/feed-templates", tags=["feed-templates"])
app.include_router(nutrition_router.router, prefix="/nutrition", tags=["nutrition"])
app.include_router(targets_router.router, prefix="/targets", tags=["targets"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
