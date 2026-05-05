from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from .. import schemas, models, db, auth

router = APIRouter()


@router.get("/baby/{baby_id}", response_model=list[schemas.DailyWeight])
def read_daily_weights(
    baby_id: int,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.DailyWeight)
        .filter(models.DailyWeight.baby_id == baby_id)
        .order_by(models.DailyWeight.date.asc())
        .all()
    )


@router.post("/baby/{baby_id}", response_model=schemas.DailyWeight)
def upsert_daily_weight(
    baby_id: int,
    payload: schemas.DailyWeightCreate,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    weight = (
        db.query(models.DailyWeight)
        .filter(models.DailyWeight.baby_id == baby_id, models.DailyWeight.date == payload.date)
        .first()
    )
    if weight:
        weight.weight = payload.weight
    else:
        weight = models.DailyWeight(
            baby_id=baby_id,
            date=payload.date,
            weight=payload.weight,
        )
        db.add(weight)

    db.commit()
    db.refresh(weight)
    return weight


@router.get("/baby/{baby_id}/{weight_date}", response_model=schemas.DailyWeight)
def read_daily_weight(
    baby_id: int,
    weight_date: date,
    db: Session = Depends(db.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    weight = (
        db.query(models.DailyWeight)
        .filter(models.DailyWeight.baby_id == baby_id, models.DailyWeight.date == weight_date)
        .first()
    )
    if not weight:
        raise HTTPException(status_code=404, detail="Daily weight not found")
    return weight
