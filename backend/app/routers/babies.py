from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, db, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.Baby])
def read_babies(skip: int = 0, limit: int = 100, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    babies = db.query(models.Baby).offset(skip).limit(limit).all()
    return babies

@router.get("/{baby_id}", response_model=schemas.Baby)
def read_baby(baby_id: int, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    baby = db.query(models.Baby).filter(models.Baby.id == baby_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="Baby not found")
    return baby

@router.post("/", response_model=schemas.Baby, status_code=status.HTTP_201_CREATED)
def create_baby(baby: schemas.BabyCreate, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    db_baby = models.Baby(**baby.dict())
    db.add(db_baby)
    db.commit()
    db.refresh(db_baby)
    return db_baby

@router.delete("/{baby_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_baby(baby_id: int, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    baby = db.query(models.Baby).filter(models.Baby.id == baby_id).first()
    if not baby:
        raise HTTPException(status_code=404, detail="Baby not found")
    # Remove dependent records first to avoid FK constraint failures.
    db.query(models.NutritionLog).filter(models.NutritionLog.baby_id == baby_id).delete()
    db.query(models.TargetSetting).filter(models.TargetSetting.baby_id == baby_id).delete()
    db.delete(baby)
    db.commit()
    return None
