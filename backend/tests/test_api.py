import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Test SQLite in-memory database with StaticPool to persist schema across threads/connections
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(test_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def client():
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def test_full_family_lifecycle_and_privacy(client):
    # 1. Register a new family and admin (optional password)
    setup_resp = client.post(
        "/api/families",
        json={
            "name": "The Millers",
            "family_code": "MILLER-2024",
            "admin_alias": "Mom",
            "admin_avatar": "👩",
        },
    )
    assert setup_resp.status_code == 201, setup_resp.text
    setup_data = setup_resp.json()
    mom_token = setup_data["access_token"]
    mom_id = setup_data["user"]["id"]
    family_code = setup_data["family"]["code"]
    assert setup_data["user"]["is_admin"] is True
    assert setup_data["user"]["alias"] == "Mom"

    mom_headers = {"Authorization": f"Bearer {mom_token}"}

    # 2. Public lookup for the mobile login screen
    lookup_resp = client.get(f"/api/families/lookup?code={family_code}")
    assert lookup_resp.status_code == 200
    lookup_data = lookup_resp.json()
    assert lookup_data["name"] == "The Millers"
    assert len(lookup_data["members"]) == 1
    assert lookup_data["members"][0]["alias"] == "Mom"

    # 3. Admin creates aliases for "Dad" and "Timmy" (No PIN needed)
    create_dad_resp = client.post(
        "/api/admin/members",
        headers=mom_headers,
        json={"alias": "Dad", "avatar": "🧔"},
    )
    assert create_dad_resp.status_code == 201
    dad_data = create_dad_resp.json()
    dad_id = dad_data["id"]
    assert dad_data["is_admin"] is False

    create_timmy_resp = client.post(
        "/api/admin/members",
        headers=mom_headers,
        json={"alias": "Timmy", "avatar": "👦"},
    )
    assert create_timmy_resp.status_code == 201
    timmy_data = create_timmy_resp.json()
    timmy_id = timmy_data["id"]

    # 4. Lookup again: All 3 members now appear on family login screen
    lookup_again = client.get(f"/api/families/lookup?code={family_code}").json()
    assert len(lookup_again["members"]) == 3

    # 5. Non-admin attempting to create a member must fail with 403 Forbidden
    login_timmy_resp = client.post(
        "/api/auth/login",
        json={"family_code": family_code, "alias": "Timmy"},
    )
    assert login_timmy_resp.status_code == 200
    timmy_login_data = login_timmy_resp.json()
    timmy_token = timmy_login_data["access_token"]
    timmy_headers = {"Authorization": f"Bearer {timmy_token}"}
    assert timmy_login_data["family"]["members"] is not None
    assert len(timmy_login_data["family"]["members"]) == 3

    forbidden_resp = client.post(
        "/api/admin/members",
        headers=timmy_headers,
        json={"alias": "Hacker", "avatar": "🦹"},
    )
    assert forbidden_resp.status_code == 403

    # 6. Dad logs in directly by typing his name (no PIN needed)
    login_dad_resp = client.post(
        "/api/auth/login",
        json={"family_code": family_code, "alias": "Dad"},
    )
    assert login_dad_resp.status_code == 200
    dad_token = login_dad_resp.json()["access_token"]
    dad_headers = {"Authorization": f"Bearer {dad_token}"}

    # 7. Timmy adds an item to his wishlist
    item_resp = client.post(
        "/api/items",
        headers=timmy_headers,
        json={
            "title": "Nintendo Switch OLED",
            "description": "White version preferred, for Zelda!",
            "price": 349.99,
            "priority": "must_have",
            "url": "https://example.com/switch",
            "alt_url": "https://amazon.com/switch",
        },
    )
    assert item_resp.status_code == 201
    item_id = item_resp.json()["id"]
    assert item_resp.json()["alt_url"] == "https://amazon.com/switch"
    assert item_resp.json()["is_on_sale"] is False

    # 7b. Timmy updates the item to be on sale
    update_sale_resp = client.put(
        f"/api/items/{item_id}",
        headers=timmy_headers,
        json={"is_on_sale": True},
    )
    assert update_sale_resp.status_code == 200
    assert update_sale_resp.json()["is_on_sale"] is True

    # 8. Timmy views his own list -> claim is None
    timmy_items = client.get(f"/api/users/{timmy_id}/items", headers=timmy_headers).json()
    assert len(timmy_items) == 1
    assert timmy_items[0]["is_owner"] is True
    assert timmy_items[0]["claim"] is None
    assert timmy_items[0]["alt_url"] == "https://amazon.com/switch"
    assert timmy_items[0]["is_on_sale"] is True

    # 9. Timmy tries to claim his own item -> 400 Bad Request
    self_claim_resp = client.post(
        f"/api/items/{item_id}/claim",
        headers=timmy_headers,
        json={"status": "claimed"},
    )
    assert self_claim_resp.status_code == 400

    # 10. Mom claims and marks purchased
    claim_resp = client.post(
        f"/api/items/{item_id}/claim",
        headers=mom_headers,
        json={"status": "purchased", "notes": "Got on discount with 2 games!"},
    )
    assert claim_resp.status_code == 201
    assert claim_resp.json()["status"] == "purchased"

    # 11. Dad tries to claim the same item -> 409 Conflict
    conflict_claim = client.post(
        f"/api/items/{item_id}/claim",
        headers=dad_headers,
        json={"status": "claimed"},
    )
    assert conflict_claim.status_code == 409

    # 12. CRITICAL PRIVACY CONDITIONAL RENDERING VERIFICATION:
    # A) Timmy views his list -> claim is completely redacted (None)!
    timmy_view = client.get(f"/api/users/{timmy_id}/items", headers=timmy_headers).json()
    assert timmy_view[0]["claim"] is None
    assert timmy_view[0]["is_owner"] is True

    # B) Dad views Timmy's list -> Dad sees that Mom purchased it!
    dad_view = client.get(f"/api/users/{timmy_id}/items", headers=dad_headers).json()
    assert dad_view[0]["is_owner"] is False
    assert dad_view[0]["claim"] is not None
    assert dad_view[0]["claim"]["status"] == "purchased"
    assert dad_view[0]["claim"]["claimed_by_alias"] == "Mom"
    assert dad_view[0]["claim"]["claimed_by_avatar"] == "👩"
    assert dad_view[0]["claim"]["notes"] == "Got on discount with 2 games!"
    assert dad_view[0]["claim"]["is_claimed_by_viewer"] is False

    # C) Mom views Timmy's list -> Mom sees her own claim
    mom_view = client.get(f"/api/users/{timmy_id}/items", headers=mom_headers).json()
    assert mom_view[0]["claim"]["is_claimed_by_viewer"] is True

    # 13. Timmy updates his own profile (name & avatar) without logging out
    update_prof = client.put(
        "/api/auth/me",
        headers=timmy_headers,
        json={"alias": "Timothy", "avatar": "🚀"},
    )
    assert update_prof.status_code == 200
    assert update_prof.json()["alias"] == "Timothy"
    assert update_prof.json()["avatar"] == "🚀"

    # 14. Non-admin (Timothy) tries to update family name/code -> 403 Forbidden
    non_admin_update = client.put(
        "/api/families/current",
        headers=timmy_headers,
        json={"name": "Hacked Family", "code": "HACK-9999"},
    )
    assert non_admin_update.status_code == 403

    # 15. Admin (Mom) updates family name only -> 200 OK, code_changed=False
    update_name_resp = client.put(
        "/api/families/current",
        headers=mom_headers,
        json={"name": "The Fabulous Millers"},
    )
    assert update_name_resp.status_code == 200
    name_data = update_name_resp.json()
    assert name_data["name"] == "The Fabulous Millers"
    assert name_data["code"] == "MILLER-2024"
    assert name_data["code_changed"] is False

    # 16. Create another family to test duplicate code collision
    client.post(
        "/api/families",
        json={
            "name": "The Johnsons",
            "family_code": "JOHNSON-2024",
            "admin_alias": "Bob",
        },
    )
    dup_code_resp = client.put(
        "/api/families/current",
        headers=mom_headers,
        json={"code": "JOHNSON-2024"},
    )
    assert dup_code_resp.status_code == 409

    # 17. Admin (Mom) updates family code -> 200 OK, code_changed=True
    update_code_resp = client.put(
        "/api/families/current",
        headers=mom_headers,
        json={"name": "The Miller Clan", "code": "MILLER-2025"},
    )
    assert update_code_resp.status_code == 200
    code_data = update_code_resp.json()
    assert code_data["name"] == "The Miller Clan"
    assert code_data["code"] == "MILLER-2025"
    assert code_data["code_changed"] is True

    # 18. Verify public lookup with new code works, old code returns 404
    assert client.get("/api/families/lookup?code=MILLER-2025").status_code == 200
    assert client.get("/api/families/lookup?code=MILLER-2024").status_code == 404
