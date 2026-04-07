from datetime import date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# ---------- Auth Schemas ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = Field(..., pattern="^(admin|doctor)$")

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

# ---------- Baby Schemas ----------
class BabyBase(BaseModel):
    name: str
    dob: date
    weight: float
    gestational_age: int
    patient_id: str

class BabyCreate(BabyBase):
    pass

class Baby(BabyBase):
    id: int

    class Config:
        orm_mode = True

# ---------- Feed Template Schemas ----------
class FeedTemplateBase(BaseModel):
    name: str
    base_quantity_ml: float
    calories: float
    protein: float
    fat: float
    carbs: float
    calcium: float
    phosphorous: float
    sodium: float
    potassium: float
    iron: float
    zinc: float
    vitamin_a: float
    vitamin_d: float
    vitamin_c: float
    folic_acid: float
    vitamin_b12: float
    magnesium: float

class FeedTemplateCreate(FeedTemplateBase):
    pass

class FeedTemplate(FeedTemplateBase):
    id: int

    class Config:
        orm_mode = True

# ---------- NutritionLog Schemas ----------
class NutritionLogBase(BaseModel):
    baby_id: int
    date: date
    feed_name: str
    quantity_ml: Optional[float] = None
    
    # Manual nutrient entries
    calories: float
    protein: float
    fat: float
    carbs: float
    calcium: float
    phosphorous: float
    sodium: float
    potassium: float
    iron: float
    zinc: float
    vitamin_a: float
    vitamin_d: float
    vitamin_c: float
    folic_acid: float
    vitamin_b12: float
    magnesium: float

class NutritionLogCreate(NutritionLogBase):
    pass

class NutritionLog(NutritionLogBase):
    id: int

    class Config:
        orm_mode = True

# ---------- Target Setting Schemas ----------
class TargetSettingBase(BaseModel):
    baby_id: Optional[int] = None  # Null for global defaults
    min_day_of_life: int
    max_day_of_life: int
    weight_range_min: float
    weight_range_max: float
    calories_per_kg: float
    calories_per_kg_max: Optional[float] = None
    protein_per_kg: float
    protein_per_kg_max: Optional[float] = None
    fat_per_kg: float = 0.0
    fat_per_kg_max: Optional[float] = None
    sodium_per_kg: float
    sodium_per_kg_max: Optional[float] = None
    potassium_per_kg: float
    potassium_per_kg_max: Optional[float] = None
    calcium_per_kg: float
    calcium_per_kg_max: Optional[float] = None
    phosphorous_per_kg: float
    phosphorous_per_kg_max: Optional[float] = None
    iron_per_kg: float
    iron_per_kg_max: Optional[float] = None
    zinc_per_kg: float
    zinc_per_kg_max: Optional[float] = None
    vitamin_a_per_kg: float
    vitamin_a_per_kg_max: Optional[float] = None
    vitamin_d_per_kg: float
    vitamin_d_per_kg_max: Optional[float] = None
    vitamin_c_per_kg: float
    vitamin_c_per_kg_max: Optional[float] = None
    folic_acid_per_kg: float
    folic_acid_per_kg_max: Optional[float] = None
    vitamin_b12_per_kg: float
    vitamin_b12_per_kg_max: Optional[float] = None
    magnesium_per_kg: float
    magnesium_per_kg_max: Optional[float] = None

class TargetSettingCreate(TargetSettingBase):
    pass

class TargetSetting(TargetSettingBase):
    id: int

    class Config:
        orm_mode = True
