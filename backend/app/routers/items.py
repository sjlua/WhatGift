from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Item, ItemClaim, User, ClaimStatus
from app.schemas import (
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    ItemClaimCreate,
    ItemClaimUpdate,
    ItemClaimResponse,
)

router = APIRouter(tags=["Wishlist Items & Claims"])


@router.get("/users/{user_id}/items", response_model=List[ItemResponse])
def get_user_wishlist(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch all wishlist items for a family member.
    Enforces privacy firewall:
    - If current_user is the OWNER (current_user.id == user_id):
      All claim info is redacted (claim=None).
    - If current_user is ANOTHER family member:
      Claim status, purchaser alias, and secret notes are included.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Access control: Must belong to the same family
    if target_user.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view wishlists outside of your family circle",
        )

    items = (
        db.query(Item)
        .filter(Item.user_id == user_id, Item.is_archived.is_(False))
        .order_by(Item.created_at.desc())
        .all()
    )

    return [item.to_dict(viewer_user_id=current_user.id) for item in items]


@router.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_wishlist_item(
    payload: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a new item to the authenticated user's wishlist.
    """
    item = Item(
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        url=str(payload.url).strip() if payload.url else None,
        alt_url=str(payload.alt_url).strip() if payload.alt_url else None,
        image_url=str(payload.image_url).strip() if payload.image_url else None,
        price=payload.price,
        priority=payload.priority,
        is_on_sale=payload.is_on_sale,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return item.to_dict(viewer_user_id=current_user.id)


@router.put("/items/{item_id}", response_model=ItemResponse)
def update_wishlist_item(
    item_id: int,
    payload: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update details of a wishlist item. Only the item owner can update it.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit items on your own wishlist",
        )

    if payload.title is not None:
        item.title = payload.title.strip()
    if payload.description is not None:
        item.description = payload.description.strip() if payload.description else None
    if payload.url is not None:
        item.url = str(payload.url).strip() if payload.url else None
    if payload.alt_url is not None:
        item.alt_url = str(payload.alt_url).strip() if payload.alt_url else None
    if payload.image_url is not None:
        item.image_url = str(payload.image_url).strip() if payload.image_url else None
    if payload.price is not None:
        item.price = payload.price
    if payload.priority is not None:
        item.priority = payload.priority
    if payload.is_on_sale is not None:
        item.is_on_sale = payload.is_on_sale
    if payload.is_archived is not None:
        item.is_archived = payload.is_archived

    db.commit()
    db.refresh(item)

    return item.to_dict(viewer_user_id=current_user.id)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wishlist_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a wishlist item. Only the owner (or family admin) can delete it.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own items",
        )

    db.delete(item)
    db.commit()
    return None


# ==========================================
# Claiming & Purchasing Routes
# ==========================================
@router.post("/items/{item_id}/claim", response_model=ItemClaimResponse, status_code=status.HTTP_201_CREATED)
def claim_item(
    item_id: int,
    payload: ItemClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Claim or mark purchased an item on another family member's wishlist.
    - Owner CANNOT claim their own item.
    - Prevents double-claiming if already claimed.
    """
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Item owner check
    if item.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot claim an item on your own wishlist!",
        )

    # Family scope check
    if item.owner.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot claim items from a different family circle",
        )

    # Check if already claimed
    if item.claim:
        claimer_name = item.claim.claimed_by.alias if item.claim.claimed_by else "another member"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This item was already claimed by {claimer_name}.",
        )

    new_claim = ItemClaim(
        item_id=item.id,
        user_id=current_user.id,
        status=payload.status,
        notes=payload.notes.strip() if payload.notes else None,
    )
    db.add(new_claim)
    db.commit()
    db.refresh(new_claim)

    return new_claim.to_dict(viewer_user_id=current_user.id)


@router.patch("/items/{item_id}/claim", response_model=ItemClaimResponse)
def update_item_claim(
    item_id: int,
    payload: ItemClaimUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update status (e.g. from 'claimed' to 'purchased') or secret notes.
    Only the claiming member can update their claim.
    """
    claim = db.query(ItemClaim).filter(ItemClaim.item_id == item_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found for this item")

    if claim.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the person who claimed this item can update the claim",
        )

    if payload.status is not None:
        claim.status = payload.status
    if payload.notes is not None:
        claim.notes = payload.notes.strip() if payload.notes else None

    db.commit()
    db.refresh(claim)

    return claim.to_dict(viewer_user_id=current_user.id)


@router.delete("/items/{item_id}/claim", status_code=status.HTTP_204_NO_CONTENT)
def unclaim_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Release a claim so another family member can purchase it.
    Only the claimer (or family admin) can release the claim.
    """
    claim = db.query(ItemClaim).filter(ItemClaim.item_id == item_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if claim.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only release your own claims",
        )

    db.delete(claim)
    db.commit()
    return None
