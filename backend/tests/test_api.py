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

    # 7c. Timmy updates the item notes / description
    update_notes_resp = client.put(
        f"/api/items/{item_id}",
        headers=timmy_headers,
        json={"description": "Updated note: Size L in Black"},
    )
    assert update_notes_resp.status_code == 200
    assert update_notes_resp.json()["description"] == "Updated note: Size L in Black"

    # 7d. Timmy clears the description by passing null
    clear_notes_resp = client.put(
        f"/api/items/{item_id}",
        headers=timmy_headers,
        json={"description": None},
    )
    assert clear_notes_resp.status_code == 200
    assert clear_notes_resp.json()["description"] is None

    # Restore description for remaining tests
    client.put(
        f"/api/items/{item_id}",
        headers=timmy_headers,
        json={"description": "White version preferred, for Zelda!"},
    )

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

    # D) Verify GET /api/families/current reflects viewer_claim_status
    mom_fam = client.get("/api/families/current", headers=mom_headers).json()
    timmy_in_mom_fam = next(m for m in mom_fam["members"] if m["id"] == timmy_id)
    assert timmy_in_mom_fam["viewer_claim_status"] == "bought"

    dad_fam = client.get("/api/families/current", headers=dad_headers).json()
    timmy_in_dad_fam = next(m for m in dad_fam["members"] if m["id"] == timmy_id)
    assert timmy_in_dad_fam["viewer_claim_status"] is None

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

    # 19. Wishlist Reset: Non-admin fails with 403, Admin resets all items
    reset_forbidden = client.post("/api/admin/reset-wishlist", headers=timmy_headers)
    assert reset_forbidden.status_code == 403

    reset_success = client.post("/api/admin/reset-wishlist", headers=mom_headers)
    assert reset_success.status_code == 200
    assert reset_success.json()["deleted_count"] == 1

    # Verify Timmy's list is now empty
    empty_items = client.get(f"/api/users/{timmy_id}/items", headers=timmy_headers).json()
    assert len(empty_items) == 0


def test_scrape_product_link_endpoint(client):
    setup_resp = client.post(
        "/api/families",
        json={"name": "Scrape Family", "admin_alias": "ScraperMom"},
    )
    token = setup_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Link endpoint with retailer URL
    res = client.post(
        "/api/items/scrape-link",
        headers=headers,
        json={"url": "https://www.jbhifi.com.au/products/apple-airpods-max-space-grey"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["site_name"] == "JB Hi-Fi"
    assert "Airpods" in data["title"] or "apple" in data["title"].lower()


def test_scraper_unit_parsing():
    from app.scraper import MetaTagParser, parse_price, extract_product_from_json_ld, clean_title

    html_doc = """
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="og:title" content="Sony WH-1000XM5 Wireless Headphones (Black)" />
      <meta property="og:image" content="https://www.jbhifi.com.au/sony-xm5.jpg" />
      <meta property="og:description" content="Noise cancelling headphones with exceptional sound." />
      <meta property="og:site_name" content="JB Hi-Fi" />
      <meta property="product:price:amount" content="549.00" />
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Sony WH-1000XM5",
        "offers": {
          "@type": "Offer",
          "price": "549.00",
          "priceCurrency": "AUD"
        }
      }
      </script>
    </head>
    </html>
    """
    parser = MetaTagParser()
    parser.feed(html_doc)
    assert len(parser.meta_tags) == 5
    assert len(parser.json_ld_scripts) == 1

    assert parse_price("$549.00") == 549.00
    assert parse_price("AUD 129.50") == 129.50
    assert clean_title("Sony Headphones | JB Hi-Fi", "JB Hi-Fi") == "Sony Headphones"


def test_amazon_scraper_html_parsing():
    from app.scraper import extract_price_from_html, clean_title

    # 1. Amazon Australia desktop with .priceToPay and .a-offscreen
    amazon_desktop_html = """
    <html>
    <head><title>Amazon.com.au: Apple AirPods Pro (2nd Generation) : Electronics</title></head>
    <body>
      <div id="corePriceDisplay_desktop_feature_div">
        <span class="a-price aok-align-center reinventPricePriceToPayMargin priceToPay" data-a-size="xl">
          <span class="a-offscreen">$399.00</span>
          <span aria-hidden="true"><span class="a-price-whole">399<span class="a-price-decimal">.</span></span><span class="a-price-fraction">00</span></span>
        </span>
      </div>
    </body>
    </html>
    """
    assert extract_price_from_html(amazon_desktop_html, "amazon.com.au") == 399.00
    assert clean_title("Amazon.com.au: Apple AirPods Pro (2nd Generation) : Electronics", "Amazon Australia") == "Apple AirPods Pro (2nd Generation)"

    # 2. Amazon whole + fraction without offscreen span
    amazon_split_html = """
    <div class="a-section">
      <span class="a-price-whole">79<span class="a-price-decimal">.</span></span>
      <span class="a-price-fraction">95</span>
    </div>
    """
    assert extract_price_from_html(amazon_split_html, "amazon.com.au") == 79.95

    # 3. Amazon embedded JSON / data attributes
    amazon_json_html = """
    <script>
      var data = {"priceAmount": 149.50, "displayPrice": "$149.50"};
    </script>
    """
    assert extract_price_from_html(amazon_json_html, "amazon.com.au") == 149.50


def test_url_sanitization_and_item_deduplication(client):
    from app.scraper import sanitize_url

    apple_dup = (
        "https://www.apple.com/au/shop/buy-iphone/iphone-duo/7.6-inch-display-256gb-star-white"
        "https://www.apple.com/au/shop/buy-iphone/iphone-duo/7.6-inch-display-256gb-star-white"
    )
    expected_apple = "https://www.apple.com/au/shop/buy-iphone/iphone-duo/7.6-inch-display-256gb-star-white"
    assert sanitize_url(apple_dup) == expected_apple
    assert sanitize_url("https://https://apple.com") == "https://apple.com"
    assert sanitize_url("https://apple.com https://apple.com") == "https://apple.com"
    assert sanitize_url(expected_apple) == expected_apple

    # Test via API lifecycle
    setup_resp = client.post(
        "/api/families",
        json={
            "name": "Duo Family",
            "family_code": "DUO-2026",
            "admin_alias": "Tester",
            "admin_avatar": "🎁",
        },
    )
    token = setup_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = client.post(
        "/api/items",
        headers=headers,
        json={
            "title": "iPhone Duo",
            "url": apple_dup,
            "price": 1999.00,
        },
    )
    assert create_resp.status_code == 201
    created_item = create_resp.json()
    assert created_item["url"] == expected_apple

    # Test update with duplicated URL
    update_resp = client.put(
        f"/api/items/{created_item['id']}",
        headers=headers,
        json={
            "url": (
                "https://www.jbhifi.com.au/products/case"
                "https://www.jbhifi.com.au/products/case"
            ),
        },
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["url"] == "https://www.jbhifi.com.au/products/case"


