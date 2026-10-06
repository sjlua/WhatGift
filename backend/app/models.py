import enum
from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.database import Base
from app.scraper import sanitize_url


class ItemPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    MUST_HAVE = "must_have"


class ClaimStatus(str, enum.Enum):
    WANT_TO_BUY = "want_to_buy"  # Planning / reserving to buy
    BOUGHT = "bought"            # Confirmed bought / purchased
    CLAIMED = "claimed"          # Legacy alias
    PURCHASED = "purchased"      # Legacy alias


class Family(Base):
    """
    Represents a family unit or household.
    Contains members (Users) who share wishlists and gift claims.
    """
    __tablename__ = "families"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Unique code/slug for simple family invite/lookup (e.g., "MILLER-XMAS", "GIFT-7892")
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    
    # Optional shared passcode hash for joining or accessing the family portal
    passcode_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    members: Mapped[List["User"]] = relationship(
        "User",
        back_populates="family",
        cascade="all, delete-orphan",
        order_by="User.alias",
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "member_count": len(self.members) if self.members else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class User(Base):
    """
    A family member with an alias (e.g., 'Mom', 'Dad', 'Chloe').
    Only one member per family is designated as the admin (is_admin=True)
    who creates and manages user aliases.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    family_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("families.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    # Display alias within family (e.g. "Mom", "Leo", "Aunt Sarah")
    alias: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Optional short PIN or password hash for simple alias login (nullable for zero-friction click-to-login)
    pin_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Single admin per family constraint: Only the admin can create/edit aliases
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Visual avatar identifier or emoji (e.g. "🎁", "☕", "🚀", or preset color)
    avatar: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="🎁")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    family: Mapped["Family"] = relationship("Family", back_populates="members")
    items: Mapped[List["Item"]] = relationship(
        "Item",
        back_populates="owner",
        cascade="all, delete-orphan",
        order_by="Item.created_at.desc()",
    )
    claimed_items: Mapped[List["ItemClaim"]] = relationship(
        "ItemClaim",
        back_populates="claimed_by",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        # 1. Alias must be unique within a single family (different families can both have "Mom")
        UniqueConstraint("family_id", "alias", name="uq_family_user_alias"),
        
        # 2. SQLite partial unique index: ensures at most ONE user per family has is_admin=1
        Index(
            "uq_family_single_admin",
            "family_id",
            unique=True,
            sqlite_where=text("is_admin = 1"),
        ),
    )

    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        return {
            "id": self.id,
            "family_id": self.family_id,
            "alias": self.alias,
            "is_admin": self.is_admin,
            "avatar": self.avatar,
            "has_pin": self.pin_hash is not None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Item(Base):
    """
    A wishlist item created by a user.
    """
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    alt_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    priority: Mapped[ItemPriority] = mapped_column(
        Enum(ItemPriority), default=ItemPriority.MEDIUM, nullable=False
    )
    is_on_sale: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="items")
    claim: Mapped[Optional["ItemClaim"]] = relationship(
        "ItemClaim",
        back_populates="item",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def to_dict(self, viewer_user_id: int) -> Dict[str, Any]:
        """
        Crucial Privacy Firewall:
        - If viewer is the OWNER (viewer_user_id == self.user_id):
          Redact all claim/purchase information (`claim: None`) so the owner
          cannot accidentally or intentionally spoil the surprise!
        - If viewer is ANOTHER family member:
          Include full claim information (who claimed it, status, notes)
          so they can coordinate purchases.
        """
        is_owner = (self.user_id == viewer_user_id)

        data: Dict[str, Any] = {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "url": sanitize_url(self.url),
            "alt_url": sanitize_url(self.alt_url),
            "image_url": sanitize_url(self.image_url),
            "price": self.price,
            "priority": self.priority.value if isinstance(self.priority, ItemPriority) else self.priority,
            "is_on_sale": bool(self.is_on_sale) if self.is_on_sale is not None else False,
            "is_archived": self.is_archived,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_owner": is_owner,
        }

        # Privacy logic: owner sees claim as None
        if not is_owner:
            data["claim"] = self.claim.to_dict(viewer_user_id=viewer_user_id) if self.claim else None
        else:
            data["claim"] = None

        return data


class ItemClaim(Base):
    """
    Tracks if an item has been claimed or purchased by another family member.
    The unique constraint on item_id ensures only one active claim per item.
    """
    __tablename__ = "item_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("items.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus), default=ClaimStatus.CLAIMED, nullable=False
    )
    # Secret note visible only to other non-owners (e.g., "Ordered size M in navy from Amazon")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    item: Mapped["Item"] = relationship("Item", back_populates="claim")
    claimed_by: Mapped["User"] = relationship("User", back_populates="claimed_items")

    def to_dict(self, viewer_user_id: Optional[int] = None) -> Dict[str, Any]:
        raw_status = self.status.value if isinstance(self.status, ClaimStatus) else self.status
        return {
            "id": self.id,
            "item_id": self.item_id,
            "claimed_by_id": self.user_id,
            "claimed_by_alias": self.claimed_by.alias if self.claimed_by else None,
            "claimed_by_avatar": self.claimed_by.avatar if (self.claimed_by and self.claimed_by.avatar) else "🎁",
            "status": raw_status,
            "notes": self.notes,
            "is_claimed_by_viewer": (viewer_user_id == self.user_id) if viewer_user_id is not None else False,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
