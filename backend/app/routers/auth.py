from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user
from app.database import get_db
from app.models import Family, User
from app.schemas import (
    AuthResponse,
    FamilyResponse,
    FamilyMemberSummary,
    LoginRequest,
    ProfileUpdateRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=AuthResponse)
def login_with_alias(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Simple first-name / alias login:
    1. Looks up family by family_code.
    2. Looks up user by their first name (alias) within that family (case-insensitive).
    3. No PIN needed! Directly issues a session token.
    """
    clean_code = payload.family_code.strip().upper()
    family = db.query(Family).filter(Family.code == clean_code).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found. Please verify the family code.",
        )

    # Case-insensitive first name / alias lookup
    clean_alias = payload.alias.strip()
    user = (
        db.query(User)
        .filter(
            User.family_id == family.id,
            func.lower(User.alias) == func.lower(clean_alias),
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Name '{clean_alias}' was not found in {family.name}. Check spelling or ask your admin.",
        )

    token = create_access_token(
        user_id=user.id,
        family_id=family.id,
        is_admin=user.is_admin,
    )

    members_data = [
        FamilyMemberSummary(
            id=m.id,
            alias=m.alias,
            avatar=m.avatar,
            is_admin=m.is_admin,
            has_pin=False,
            item_count=len([i for i in m.items if not getattr(i, "is_archived", False)]) if m.items else 0,
        )
        for m in family.members
    ]

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            family_id=user.family_id,
            alias=user.alias,
            is_admin=user.is_admin,
            avatar=user.avatar,
            has_pin=False,
            created_at=user.created_at,
        ),
        family=FamilyResponse(
            id=family.id,
            name=family.name,
            code=family.code,
            created_at=family.created_at,
            members=members_data,
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the profile and role of the currently logged-in user.
    """
    return UserResponse(
        id=current_user.id,
        family_id=current_user.family_id,
        alias=current_user.alias,
        is_admin=current_user.is_admin,
        avatar=current_user.avatar,
        has_pin=False,
        created_at=current_user.created_at,
    )


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Allows the logged-in user to update their own name/alias and avatar emoji.
    Does NOT log the user out.
    """
    if payload.alias is not None:
        clean_alias = payload.alias.strip()
        if clean_alias and func.lower(clean_alias) != func.lower(current_user.alias):
            conflict = (
                db.query(User)
                .filter(
                    User.family_id == current_user.family_id,
                    User.id != current_user.id,
                    func.lower(User.alias) == func.lower(clean_alias),
                )
                .first()
            )
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"The name '{clean_alias}' is already in use by someone else in your family.",
                )
            current_user.alias = clean_alias

    if payload.avatar is not None:
        current_user.avatar = payload.avatar

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        family_id=current_user.family_id,
        alias=current_user.alias,
        is_admin=current_user.is_admin,
        avatar=current_user.avatar,
        has_pin=False,
        created_at=current_user.created_at,
    )
