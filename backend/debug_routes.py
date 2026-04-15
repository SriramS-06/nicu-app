from app.main import app

print("Listing all registered routes:")
for route in app.routes:
    if hasattr(route, "path"):
        print(f"Path: {route.path} | Name: {route.name} | Methods: {getattr(route, 'methods', 'N/A')}")
