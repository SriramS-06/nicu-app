from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, models, db, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.TargetSetting])
def read_targets(skip: int = 0, limit: int = 100, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.TargetSetting).offset(skip).limit(limit).all()

@router.get("/{target_id}", response_model=schemas.TargetSetting)
def read_target(target_id: int, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    target = db.query(models.TargetSetting).filter(models.TargetSetting.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target setting not found")
    return target

@router.post("/", response_model=schemas.TargetSetting, status_code=status.HTTP_201_CREATED)
def create_target(target: schemas.TargetSettingCreate, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    db_target = models.TargetSetting(**target.dict())
    db.add(db_target)
    db.commit()
    db.refresh(db_target)
    return db_target

@router.get("/baby/{baby_id}/daily", response_model=Optional[schemas.TargetSetting])
def get_daily_target_for_baby(
    baby_id: int,
    day_of_life: int,
    weight: float,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
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
    return target
