from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base

# ---------- User Model ----------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "admin" or "doctor"

    # Relationships
    nutrition_logs = relationship("NutritionLog", back_populates="created_by_user")

# ---------- Baby Model ----------
class Baby(Base):
    __tablename__ = "babies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    dob = Column(Date, nullable=False)
    weight = Column(Float, nullable=False)  # kg
    gestational_age = Column(Integer, nullable=False)  # weeks
    patient_id = Column(String, unique=True, nullable=False)

    # Relationships
    nutrition_logs = relationship("NutritionLog", back_populates="baby")
    target_settings = relationship("TargetSetting", back_populates="baby")

# ---------- FeedTemplate Model ----------
class FeedTemplate(Base):
    __tablename__ = "feed_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    base_quantity_ml = Column(Float, nullable=False)
    # Nutrients per base quantity (all float values)
    calories = Column(Float, nullable=False)
    protein = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    calcium = Column(Float, nullable=False)
    phosphorous = Column(Float, nullable=False)
    sodium = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    iron = Column(Float, nullable=False)
    zinc = Column(Float, nullable=False)
    vitamin_a = Column(Float, nullable=False)
    vitamin_d = Column(Float, nullable=False)
    vitamin_c = Column(Float, nullable=False)
    folic_acid = Column(Float, nullable=False)
    vitamin_b12 = Column(Float, nullable=False)
    magnesium = Column(Float, nullable=False)

# ---------- NutritionLog Model ----------
class NutritionLog(Base):
    __tablename__ = "nutrition_logs"
    id = Column(Integer, primary_key=True, index=True)
    baby_id = Column(Integer, ForeignKey("babies.id"), nullable=False)
    date = Column(Date, nullable=False)
    feed_name = Column(String, nullable=False)
    quantity_ml = Column(Float, nullable=True)
    # Calculated nutrients (store for quick retrieval)
    calories = Column(Float, nullable=False)
    protein = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    calcium = Column(Float, nullable=False)
    phosphorous = Column(Float, nullable=False)
    sodium = Column(Float, nullable=False)
    potassium = Column(Float, nullable=False)
    iron = Column(Float, nullable=False)
    zinc = Column(Float, nullable=False)
    vitamin_a = Column(Float, nullable=False)
    vitamin_d = Column(Float, nullable=False)
    vitamin_c = Column(Float, nullable=False)
    folic_acid = Column(Float, nullable=False)
    vitamin_b12 = Column(Float, nullable=False)
    magnesium = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    baby = relationship("Baby", back_populates="nutrition_logs")
    created_by_user = relationship("User", back_populates="nutrition_logs")

# ---------- TargetSetting Model ----------
class TargetSetting(Base):
    __tablename__ = "target_settings"
    id = Column(Integer, primary_key=True, index=True)
    baby_id = Column(Integer, ForeignKey("babies.id"), nullable=True)  # Null for global defaults
    min_day_of_life = Column(Integer, nullable=False)
    max_day_of_life = Column(Integer, nullable=False)
    weight_range_min = Column(Float, nullable=False)
    weight_range_max = Column(Float, nullable=False)
    # Targets per kg (float values)
    calories_per_kg = Column(Float, nullable=False)
    calories_per_kg_max = Column(Float, nullable=True)
    protein_per_kg = Column(Float, nullable=False)
    protein_per_kg_max = Column(Float, nullable=True)
    fat_per_kg = Column(Float, nullable=False, default=0.0)
    fat_per_kg_max = Column(Float, nullable=True)
    sodium_per_kg = Column(Float, nullable=False)
    sodium_per_kg_max = Column(Float, nullable=True)
    potassium_per_kg = Column(Float, nullable=False)
    potassium_per_kg_max = Column(Float, nullable=True)
    calcium_per_kg = Column(Float, nullable=False)
    calcium_per_kg_max = Column(Float, nullable=True)
    phosphorous_per_kg = Column(Float, nullable=False)
    phosphorous_per_kg_max = Column(Float, nullable=True)
    iron_per_kg = Column(Float, nullable=False)
    iron_per_kg_max = Column(Float, nullable=True)
    zinc_per_kg = Column(Float, nullable=False)
    zinc_per_kg_max = Column(Float, nullable=True)
    vitamin_a_per_kg = Column(Float, nullable=False)
    vitamin_a_per_kg_max = Column(Float, nullable=True)
    vitamin_d_per_kg = Column(Float, nullable=False)
    vitamin_d_per_kg_max = Column(Float, nullable=True)
    vitamin_c_per_kg = Column(Float, nullable=False)
    vitamin_c_per_kg_max = Column(Float, nullable=True)
    folic_acid_per_kg = Column(Float, nullable=False)
    folic_acid_per_kg_max = Column(Float, nullable=True)
    vitamin_b12_per_kg = Column(Float, nullable=False)
    vitamin_b12_per_kg_max = Column(Float, nullable=True)
    magnesium_per_kg = Column(Float, nullable=False)
    magnesium_per_kg_max = Column(Float, nullable=True)

    # Relationships
    baby = relationship("Baby", back_populates="target_settings")
