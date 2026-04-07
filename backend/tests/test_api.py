from fastapi.testclient import TestClient
from app.main import app
from app.routers.nutrition import calculate_nutrients
from app.models import FeedTemplate

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_nutrient_calculations():
    # Setup mock feed template with baseline nutrients per 100ml
    mock_feed = FeedTemplate(
        id=1,
        name="Test Formula 1",
        calories=80.0,
        protein=2.0,
        fat=3.5,
        carbs=10.0,
        calcium=100.0,
        phosphorous=50.0,
        sodium=20.0,
        potassium=30.0,
        iron=1.0,
        zinc=0.5,
        vitamin_a=200.0,
        vitamin_d=40.0,
        vitamin_c=10.0,
        folic_acid=5.0,
        vitamin_b12=0.2,
        magnesium=4.0
    )

    # Calculate for 50ml (expect 50% of the per 100ml values)
    result = calculate_nutrients(mock_feed, 50.0)

    # Assert correct fractional scaling
    assert result["calories"] == 40.0
    assert result["protein"] == 1.0
    assert result["fat"] == 1.75
    assert result["carbs"] == 5.0
    assert result["calcium"] == 50.0
    assert result["vitamin_a"] == 100.0
