from app.db import SessionLocal
from app.models import User
from app.auth import get_password_hash

db = SessionLocal()

# Check if admin already exists
existing_admin = db.query(User).filter(User.email == "admin@nicu.com").first()

if not existing_admin:
    hashed_password = get_password_hash("admin")
    admin_user = User(
        name="Admin Doctor",
        email="admin@nicu.com",
        password_hash=hashed_password,
        role="admin"
    )
    db.add(admin_user)
    db.commit()
    print("Admin user created successfully.")
else:
    print("Admin user already exists.")

db.close()
