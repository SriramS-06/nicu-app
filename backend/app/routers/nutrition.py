from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from .. import schemas, models, db, auth

router = APIRouter()

@router.post("/", response_model=schemas.NutritionLog, status_code=status.HTTP_201_CREATED)
def create_nutrition_log(entry: schemas.NutritionLogCreate, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Create the manual log directly from the payload without scaling
    db_entry = models.NutritionLog(
        baby_id=entry.baby_id,
        date=entry.date,
        feed_name=entry.feed_name,
        quantity_ml=entry.quantity_ml,
        calories=entry.calories,
        protein=entry.protein,
        fat=entry.fat,
        carbs=entry.carbs,
        calcium=entry.calcium,
        phosphorous=entry.phosphorous,
        sodium=entry.sodium,
        potassium=entry.potassium,
        iron=entry.iron,
        zinc=entry.zinc,
        vitamin_a=entry.vitamin_a,
        vitamin_d=entry.vitamin_d,
        vitamin_c=entry.vitamin_c,
        folic_acid=entry.folic_acid,
        vitamin_b12=entry.vitamin_b12,
        magnesium=entry.magnesium,
        created_by=current_user.id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/baby/{baby_id}/", response_model=List[schemas.NutritionLog])
def get_logs_for_baby(baby_id: int, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.NutritionLog).filter(models.NutritionLog.baby_id == baby_id).all()

@router.get("/baby/{baby_id}/summary", response_model=Optional[schemas.NutritionLog])
def get_daily_summary(baby_id: int, summary_date: date, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    logs = (
        db.query(models.NutritionLog)
        .filter(models.NutritionLog.baby_id == baby_id, models.NutritionLog.date == summary_date)
        .all()
    )
    if not logs:
        return None
    
    # Aggregate nutrients
    agg = {field: 0.0 for field in [
        "calories", "protein", "fat", "carbs", "calcium", "phosphorous", "sodium", "potassium",
        "iron", "zinc", "vitamin_a", "vitamin_d", "vitamin_c", "folic_acid", "vitamin_b12", "magnesium"
    ]}
    
    for log in logs:
        for key in agg:
            agg[key] += getattr(log, key)
            
    # Return a pseudo NutritionLog schema with aggregated values
    return schemas.NutritionLog(
        id=0,
        baby_id=baby_id,
        date=summary_date,
        feed_name="Daily Summary",
        quantity_ml=0,
        **agg,
    )

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition_log(log_id: int, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    log = db.query(models.NutritionLog).filter(models.NutritionLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    db.delete(log)
    db.commit()
    return None
