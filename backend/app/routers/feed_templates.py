from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from .. import schemas, models, db, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.FeedTemplate])
def read_feed_templates(skip: int = 0, limit: int = 100, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.FeedTemplate).offset(skip).limit(limit).all()

@router.get("/{template_id}", response_model=schemas.FeedTemplate)
def read_feed_template(template_id: int, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_user)):
    ft = db.query(models.FeedTemplate).filter(models.FeedTemplate.id == template_id).first()
    if not ft:
        raise HTTPException(status_code=404, detail="Feed template not found")
    return ft

@router.post("/", response_model=schemas.FeedTemplate, status_code=status.HTTP_201_CREATED)
def create_feed_template(feed: schemas.FeedTemplateCreate, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    duplicate = (
        db.query(models.FeedTemplate)
        .filter(func.lower(models.FeedTemplate.name) == feed.name.strip().lower())
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Template with this name already exists")

    db_ft = models.FeedTemplate(**feed.dict())
    db.add(db_ft)
    db.commit()
    db.refresh(db_ft)
    return db_ft

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feed_template(template_id: int, db: Session = Depends(db.get_db), current_user: models.User = Depends(auth.get_current_admin)):
    template = db.query(models.FeedTemplate).filter(models.FeedTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Feed template not found")

    db.delete(template)
    db.commit()
    return None
