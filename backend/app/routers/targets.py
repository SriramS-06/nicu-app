from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, models, db, auth

router = APIRouter()

# ---------------------------------------------------------------------------
# ESPGHAN 2022 Enteral Guidelines – fixed global defaults
# ---------------------------------------------------------------------------
# Zinc and Vitamin D are TOTAL per day (not per kg).
# All other values are per kg/day.
# The field names still use "_per_kg" for schema compatibility, but the
# frontend knows to compare zinc & vitamin_d against total intake.
# ---------------------------------------------------------------------------
ESPGHAN_2022_DEFAULTS = {
    "calories_per_kg": 115.0,      "calories_per_kg_max": 140.0,
    "protein_per_kg": 3.5,         "protein_per_kg_max": 4.0,
    "fat_per_kg": 4.8,             "fat_per_kg_max": 8.1,
    "sodium_per_kg": 3.0,          "sodium_per_kg_max": 5.0,
    "potassium_per_kg": 2.3,       "potassium_per_kg_max": 4.6,
    "calcium_per_kg": 120.0,       "calcium_per_kg_max": 200.0,
    "phosphorous_per_kg": 88.0,    "phosphorous_per_kg_max": 150.0,
    "magnesium_per_kg": 10.0,      "magnesium_per_kg_max": 12.0,
    "iron_per_kg": 2.0,            "iron_per_kg_max": 3.0,
    "zinc_per_kg": 2.0,            "zinc_per_kg_max": 3.0,         # total/day
    "vitamin_a_per_kg": 400.0,     "vitamin_a_per_kg_max": 1500.0,
    "vitamin_d_per_kg": 800.0,     "vitamin_d_per_kg_max": 1000.0, # total/day
    "vitamin_c_per_kg": 0.0,       "vitamin_c_per_kg_max": 0.0,    # no guideline
    "folic_acid_per_kg": 25.0,     "folic_acid_per_kg_max": 100.0, # μg/kg/day
    "vitamin_b12_per_kg": 0.1,     "vitamin_b12_per_kg_max": 0.8,  # μg/kg/day
    "dha_per_kg": 30.0,            "dha_per_kg_max": 65.0,
    "vitamin_e_per_kg": 2.2,       "vitamin_e_per_kg_max": 12.0,   # mg/kg/day
}

# Nutrients compared against TOTAL daily intake (not per-kg)
TOTAL_DAY_NUTRIENTS = ["vitamin_d", "zinc"]


# ---------------------------------------------------------------------------
# IMPORTANT: Static/named routes MUST come before dynamic /{id} routes.
# FastAPI matches top-to-bottom — if /{target_id} is listed first, it will
# swallow requests like /default/espghan and /baby/{id}/daily.
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[schemas.TargetSetting])
def read_targets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.TargetSetting).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.TargetSetting, status_code=status.HTTP_201_CREATED)
def create_target(
    target: schemas.TargetSettingCreate,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_admin),
):
    db_target = models.TargetSetting(**target.dict())
    db.add(db_target)
    db.commit()
    db.refresh(db_target)
    return db_target


# --- Static named routes first ---

@router.get("/default/espghan")
def get_espghan_defaults(current_user: models.User = Depends(auth.get_current_user)):
    """Return the ESPGHAN 2022 Enteral guideline defaults and metadata."""
    return {
        "targets": ESPGHAN_2022_DEFAULTS,
        "total_day_nutrients": TOTAL_DAY_NUTRIENTS,
        "note": "Zinc and Vitamin D targets are total per day. All others are per kg/day.",
    }


@router.get("/baby/{baby_id}/daily")
def get_daily_target_for_baby(
    baby_id: int,
    day_of_life: int,
    weight: float,
    db: Session = Depends(db.get_db),
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

    # 3. Fall back to ESPGHAN 2022 defaults (always returns something)
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


# --- Dynamic /{id} route LAST so it doesn't swallow named routes above ---

@router.get("/{target_id}", response_model=schemas.TargetSetting)
def read_target(
    target_id: int,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    target = db.query(models.TargetSetting).filter(models.TargetSetting.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target setting not found")
    return target
