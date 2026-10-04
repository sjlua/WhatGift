from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_admin
from app.database import get_db
from app.models import User
from app.schemas import (
    MemberCreateRequest,
    MemberUpdateRequest,
    UserResponse,
)

router = APIRouter(prefix="/admin/members", tags=["Admin Member Management"])


@router.get("", response_model=List[UserResponse])
def list_family_members(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin only: Lists all members in the admin's family.
    """
    members = (
        db.query(User)
        .filter(User.family_id == admin.family_id)
        .order_by(User.is_admin.desc(), User.alias.asc())
        .all()
    )
    return [
        UserResponse(
            id=m.id,
            family_id=m.family_id,
            alias=m.alias,
            is_admin=m.is_admin,
            avatar=m.avatar,
            has_pin=False,
            created_at=m.created_at,
        )
        for m in members
    ]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_family_member(
    payload: MemberCreateRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin only: Creates a new user alias within the family.
    Users log in simply by typing their first name - no PIN needed.
    """
    clean_alias = payload.alias.strip()

    # Check for existing alias in this family (case-insensitive)
    existing = (
        db.query(User)
        .filter(
            User.family_id == admin.family_id,
            func.lower(User.alias) == func.lower(clean_alias),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An alias named '{clean_alias}' already exists in your family.",
        )

    new_member = User(
        family_id=admin.family_id,
        alias=clean_alias,
        pin_hash=None,
        is_admin=False,
        avatar=payload.avatar or "🎁",
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    return UserResponse(
        id=new_member.id,
        family_id=new_member.family_id,
        alias=new_member.alias,
        is_admin=new_member.is_admin,
        avatar=new_member.avatar,
        has_pin=False,
        created_at=new_member.created_at,
    )


@router.put("/{user_id}", response_model=UserResponse)
def update_family_member(
    user_id: int,
    payload: MemberUpdateRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin only: Update an existing member's alias or avatar.
    """
    member = (
        db.query(User)
        .filter(User.id == user_id, User.family_id == admin.family_id)
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in your family.",
        )

    if payload.alias is not None:
        clean_alias = payload.alias.strip()
        if func.lower(clean_alias) != func.lower(member.alias):
            conflict = (
                db.query(User)
                .filter(
                    User.family_id == admin.family_id,
                    User.id != user_id,
                    func.lower(User.alias) == func.lower(clean_alias),
                )
                .first()
            )
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"An alias named '{clean_alias}' already exists in your family.",
                )
            member.alias = clean_alias

    if payload.avatar is not None:
        member.avatar = payload.avatar

    db.commit()
    db.refresh(member)

    return UserResponse(
        id=member.id,
        family_id=member.family_id,
        alias=member.alias,
        is_admin=member.is_admin,
        avatar=member.avatar,
        has_pin=False,
        created_at=member.created_at,
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family_member(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin only: Removes a member alias from the family.
    Deleting the admin themselves is prohibited.
    """
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="As the family admin, you cannot delete your own account.",
        )

    member = (
        db.query(User)
        .filter(User.id == user_id, User.family_id == admin.family_id)
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in your family.",
        )

    db.delete(member)
    db.commit()
    return None
