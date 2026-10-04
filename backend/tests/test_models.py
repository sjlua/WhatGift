import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Family, User, Item, ItemClaim, ItemPriority, ClaimStatus


@pytest.fixture
def db_session():
    """Create an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:", echo=False)

    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_create_family_and_members(db_session):
    family = Family(name="The Millers", code="MILLER-2024")
    db_session.add(family)
    db_session.commit()

    admin = User(family_id=family.id, alias="Mom", is_admin=True, avatar="👩")
    child = User(family_id=family.id, alias="Timmy", is_admin=False, avatar="👦")
    db_session.add_all([admin, child])
    db_session.commit()

    assert family.id is not None
    assert len(family.members) == 2
    assert admin.is_admin is True
    assert child.is_admin is False


def test_single_admin_per_family_constraint(db_session):
    family = Family(name="The Millers", code="MILLER-2024")
    db_session.add(family)
    db_session.commit()

    admin1 = User(family_id=family.id, alias="Mom", is_admin=True)
    db_session.add(admin1)
    db_session.commit()

    # Attempting to add a second admin to the same family must violate the partial unique index
    admin2 = User(family_id=family.id, alias="Dad", is_admin=True)
    db_session.add(admin2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_unique_alias_within_family_constraint(db_session):
    family = Family(name="The Millers", code="MILLER-2024")
    db_session.add(family)
    db_session.commit()

    user1 = User(family_id=family.id, alias="Alex", is_admin=True)
    db_session.add(user1)
    db_session.commit()

    # Attempting duplicate alias in same family must fail
    user2 = User(family_id=family.id, alias="Alex", is_admin=False)
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Same alias in a DIFFERENT family must succeed
    family2 = Family(name="The Smiths", code="SMITH-2024")
    db_session.add(family2)
    db_session.commit()

    user3 = User(family_id=family2.id, alias="Alex", is_admin=True)
    db_session.add(user3)
    db_session.commit()
    assert user3.id is not None


def test_item_creation_and_privacy_redaction(db_session):
    family = Family(name="The Millers", code="MILLER-2024")
    db_session.add(family)
    db_session.commit()

    mom = User(family_id=family.id, alias="Mom", is_admin=True)
    timmy = User(family_id=family.id, alias="Timmy", is_admin=False)
    dad = User(family_id=family.id, alias="Dad", is_admin=False)
    db_session.add_all([mom, timmy, dad])
    db_session.commit()

    # Timmy wishes for a Lego set
    lego = Item(
        user_id=timmy.id,
        title="Lego Space Shuttle",
        description="The 1000 piece set from the official Lego store",
        price=99.99,
        priority=ItemPriority.MUST_HAVE,
        url="https://example.com/lego-shuttle",
    )
    db_session.add(lego)
    db_session.commit()

    # Before claiming: both Timmy and Mom see claim as None
    timmy_view = lego.to_dict(viewer_user_id=timmy.id)
    mom_view = lego.to_dict(viewer_user_id=mom.id)
    assert timmy_view["is_owner"] is True
    assert timmy_view["claim"] is None
    assert timmy_view["is_on_sale"] is False
    assert mom_view["is_owner"] is False
    assert mom_view["claim"] is None
    assert mom_view["is_on_sale"] is False

    # Mom secretly claims and purchases the Lego set
    claim = ItemClaim(
        item_id=lego.id,
        user_id=mom.id,
        status=ClaimStatus.PURCHASED,
        notes="Ordered via Amazon Prime, delivered to work",
    )
    db_session.add(claim)
    db_session.commit()
    db_session.refresh(lego)

    # CRITICAL PRIVACY TEST:
    # 1. Timmy (owner) views the item -> claim MUST BE None! Surprise preserved.
    timmy_view_after = lego.to_dict(viewer_user_id=timmy.id)
    assert timmy_view_after["is_owner"] is True
    assert timmy_view_after["claim"] is None

    # 2. Dad (another family member) views the item -> sees Mom bought it! Prevents duplicate purchase.
    dad_view_after = lego.to_dict(viewer_user_id=dad.id)
    assert dad_view_after["is_owner"] is False
    assert dad_view_after["claim"] is not None
    assert dad_view_after["claim"]["status"] == "purchased"
    assert dad_view_after["claim"]["claimed_by_alias"] == "Mom"
    assert dad_view_after["claim"]["notes"] == "Ordered via Amazon Prime, delivered to work"
    assert dad_view_after["claim"]["is_claimed_by_viewer"] is False

    # 3. Mom (the purchaser) views the item -> sees her own claim
    mom_view_after = lego.to_dict(viewer_user_id=mom.id)
    assert mom_view_after["claim"]["is_claimed_by_viewer"] is True


def test_cannot_double_claim_item(db_session):
    family = Family(name="The Millers", code="MILLER-2024")
    db_session.add(family)
    db_session.commit()

    mom = User(family_id=family.id, alias="Mom", is_admin=True)
    dad = User(family_id=family.id, alias="Dad", is_admin=False)
    timmy = User(family_id=family.id, alias="Timmy", is_admin=False)
    db_session.add_all([mom, dad, timmy])
    db_session.commit()

    item = Item(user_id=timmy.id, title="Bicycle", priority=ItemPriority.HIGH)
    db_session.add(item)
    db_session.commit()

    # Mom claims it
    claim1 = ItemClaim(item_id=item.id, user_id=mom.id, status=ClaimStatus.CLAIMED)
    db_session.add(claim1)
    db_session.commit()

    # Dad attempts to claim the same item -> unique constraint on item_id must prevent race condition
    claim2 = ItemClaim(item_id=item.id, user_id=dad.id, status=ClaimStatus.CLAIMED)
    db_session.add(claim2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
