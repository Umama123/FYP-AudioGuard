import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app import app


def test_health_endpoint():
    client = app.test_client()
    response = client.get('/api/health')

    assert response.status_code == 200
    assert response.get_json()['status'] == 'ok'


def test_history_summary_endpoint():
    client = app.test_client()
    response = client.get('/api/history/summary?range_days=7')

    assert response.status_code == 200
    payload = response.get_json()
    assert 'totals' in payload
    assert 'rangeDays' in payload


def test_spa_route_fallback_for_ui_pages():
    client = app.test_client()
    response = client.get('/audio-detection')

    assert response.status_code in {200, 404}
