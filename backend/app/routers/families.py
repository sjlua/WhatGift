import random
import re
import string
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_secret, get_current_user, get_current_admin
from app.database import get_db
from app.models import Family, User
from app.schemas import (
    FamilySetupRequest,
    FamilyLookupResponse,
    FamilyResponse,
    FamilyMemberSummary,
    FamilyUpdateRequest,
    FamilyUpdateResponse,
    AuthResponse,
    UserResponse,
)

router = APIRouter(prefix="/families", tags=["Families"])


def generate_family_code(base_name: str, db: Session) -> str:
    """Generate an uppercase family code, ensuring uniqueness."""
    prefix = "".join(ch for ch in base_name if ch.isalnum()).upper()[:6]
    if len(prefix) < 2:
        prefix = "GIFT"

    for _ in range(20):
        suffix = "".join(random.choices(string.digits, k=4))
        candidate = f"{prefix}-{suffix}"
        if not db.query(Family).filter(Family.code == candidate).first():
            return candidate


def build_member_summary(m: User, viewer_id: Optional[int] = None) -> FamilyMemberSummary:
    item_count = len([i for i in m.items if not getattr(i, "is_archived", False)]) if m.items else 0
    viewer_claim_status = None
    if viewer_id and m.id != viewer_id and m.items:
        viewer_claims = [i.claim for i in m.items if i.claim and i.claim.user_id == viewer_id]
        if viewer_claims:
            statuses = [c.status for c in viewer_claims]
            if "bought" in statuses or "purchased" in statuses:
                viewer_claim_status = "bought"
            elif "want_to_buy" in statuses or "claimed" in statuses:
                viewer_claim_status = "want_to_buy"

    return FamilyMemberSummary(
        id=m.id,
        alias=m.alias,
        avatar=m.avatar,
        is_admin=m.is_admin,
        has_pin=False,
        item_count=item_count,
        viewer_claim_status=viewer_claim_status,
    )


@router.post("", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def create_family(payload: FamilySetupRequest, db: Session = Depends(get_db)):
    """
    Creates a new Family along with its designated administrator.
    Returns authentication credentials so the admin is logged in immediately.
    """
    # 1. Resolve family code
    if payload.family_code:
        clean_code = re.sub(r"[^A-Za-z0-9\-_]", "", payload.family_code.strip()).upper()
        existing_family = db.query(Family).filter(Family.code == clean_code).first()
        if existing_family:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Family code '{clean_code}' is already in use. Please choose another code.",
            )
        family_code = clean_code
    else:
        family_code = generate_family_code(payload.name, db)

    # 2. Create Family
    family = Family(
        name=payload.name.strip(),
        code=family_code,
    )
    db.add(family)
    db.flush()  # populate family.id

    # 3. Create Admin User (is_admin=True, password/pin is optional)
    pin_hash = hash_secret(payload.admin_password) if payload.admin_password else None

    admin_user = User(
        family_id=family.id,
        alias=payload.admin_alias.strip(),
        pin_hash=pin_hash,
        is_admin=True,
        avatar=payload.admin_avatar or "⭐",
    )
    db.add(admin_user)
    db.commit()
    db.refresh(family)
    db.refresh(admin_user)

    # 4. Generate JWT
    token = create_access_token(
        user_id=admin_user.id,
        family_id=family.id,
        is_admin=admin_user.is_admin,
    )

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=admin_user.id,
            family_id=admin_user.family_id,
            alias=admin_user.alias,
            is_admin=admin_user.is_admin,
            avatar=admin_user.avatar,
            has_pin=admin_user.pin_hash is not None,
            created_at=admin_user.created_at,
        ),
        family=FamilyResponse(
            id=family.id,
            name=family.name,
            code=family.code,
            created_at=family.created_at,
            members=[build_member_summary(admin_user)],
        ),
    )


@router.get("/lookup", response_model=FamilyLookupResponse)
def lookup_family_by_code(code: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """
    Public endpoint for the login screen:
    Given a family code, returns the family name and list of members.
    """
    clean_code = code.strip().upper()
    family = db.query(Family).filter(Family.code == clean_code).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No family found with code '{clean_code}'. Please check the code and try again.",
        )

    members_data = [build_member_summary(m) for m in family.members]

    return FamilyLookupResponse(
        id=family.id,
        name=family.name,
        code=family.code,
        members=members_data,
    )


@router.get("/current", response_model=FamilyLookupResponse)
def get_current_family(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the current user's family and member directory.
    """
    family = db.query(Family).filter(Family.id == current_user.family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")

    members_data = [build_member_summary(m, viewer_id=current_user.id) for m in family.members]

    return FamilyLookupResponse(
        id=family.id,
        name=family.name,
        code=family.code,
        members=members_data,
    )


@router.put("/current", response_model=FamilyUpdateResponse)
def update_current_family(
    payload: FamilyUpdateRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin only: Updates the family name and/or family code.
    If family code is updated, verifies uniqueness across all families.
    """
    family = db.query(Family).filter(Family.id == admin.family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")

    code_changed = False

    if payload.name is not None:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Family name cannot be blank.",
            )
        family.name = clean_name

    if payload.code is not None:
        clean_code = re.sub(r"[^A-Za-z0-9\-_]", "", payload.code.strip()).upper()
        if len(clean_code) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Family code must be at least 2 characters (letters, numbers, hyphens).",
            )
        if clean_code != family.code:
            existing = db.query(Family).filter(Family.code == clean_code, Family.id != family.id).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Family code '{clean_code}' is already taken. Please choose another code.",
                )
            family.code = clean_code
            code_changed = True

    db.commit()
    db.refresh(family)

    members_data = [build_member_summary(m, viewer_id=admin.id) for m in family.members]

    return FamilyUpdateResponse(
        id=family.id,
        name=family.name,
        code=family.code,
        code_changed=code_changed,
        members=members_data,
    )
