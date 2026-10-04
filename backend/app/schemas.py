import re
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models import ItemPriority, ClaimStatus


# ==========================================
# Family & Setup Schemas
# ==========================================
class FamilySetupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Family or household name")
    admin_alias: str = Field(..., min_length=1, max_length=50, description="Admin's display first name / alias (e.g. 'Sean')")
    admin_password: Optional[str] = Field(None, max_length=100, description="Optional admin password")
    admin_avatar: Optional[str] = Field("⭐", max_length=50)
    family_code: Optional[str] = Field(None, min_length=2, max_length=32, description="Custom code (letters, numbers, hyphens)")

    @field_validator("family_code")
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean = re.sub(r"[^A-Za-z0-9\-_]", "", v.strip()).upper()
            if len(clean) < 2:
                raise ValueError("Family code must be at least 2 alphanumeric characters")
            return clean
        return None


class FamilyMemberSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alias: str
    avatar: Optional[str] = "🎁"
    is_admin: bool
    has_pin: bool = False
    item_count: int = 0


class FamilyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    created_at: datetime
    members: Optional[List[FamilyMemberSummary]] = None


class FamilyLookupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    members: List[FamilyMemberSummary]


class FamilyUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Family or household name")
    code: Optional[str] = Field(None, min_length=2, max_length=32, description="Family identifier code")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean = re.sub(r"[^A-Za-z0-9\-_]", "", v.strip()).upper()
            if len(clean) < 2:
                raise ValueError("Family code must be at least 2 alphanumeric characters")
            return clean
        return None


class FamilyUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    code_changed: bool = False
    members: Optional[List[FamilyMemberSummary]] = None


# ==========================================
# Auth & Profile Schemas
# ==========================================
class LoginRequest(BaseModel):
    family_code: str = Field(..., description="The family identifier code")
    alias: str = Field(..., min_length=1, description="The member's first name to log in as")
    pin: Optional[str] = Field(None, description="Optional PIN/Password")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    family_id: int
    alias: str
    is_admin: bool
    avatar: Optional[str] = "🎁"
    has_pin: bool = False
    created_at: datetime


class ProfileUpdateRequest(BaseModel):
    alias: Optional[str] = Field(None, min_length=1, max_length=50, description="Update your first name / alias")
    avatar: Optional[str] = Field(None, max_length=50, description="Update your avatar emoji")


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    family: FamilyResponse


# ==========================================
# Admin Member Management Schemas
# ==========================================
class MemberCreateRequest(BaseModel):
    alias: str = Field(..., min_length=1, max_length=50, description="Member's first name / alias (e.g. 'Sean', 'Chloe')")
    avatar: Optional[str] = Field("🎁", max_length=50)


class MemberUpdateRequest(BaseModel):
    alias: Optional[str] = Field(None, min_length=1, max_length=50)
    avatar: Optional[str] = Field(None, max_length=50)


# ==========================================
# Wishlist Item Schemas
# ==========================================
class ItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Name of the desired gift")
    description: Optional[str] = Field(None, max_length=2000, description="Notes, size, color preferences")
    url: Optional[str] = Field(None, max_length=1024, description="Store or purchase URL")
    alt_url: Optional[str] = Field(None, max_length=1024, description="Alternative purchase URL")
    image_url: Optional[str] = Field(None, max_length=1024, description="Product image preview URL")
    price: float = Field(..., ge=0, description="Approximate price (required)")
    priority: ItemPriority = Field(default=ItemPriority.MEDIUM)
    is_on_sale: bool = Field(default=False, description="Whether the item is currently on sale")


class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    url: Optional[str] = None
    alt_url: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    priority: Optional[ItemPriority] = None
    is_on_sale: Optional[bool] = None
    is_archived: Optional[bool] = None


class ItemClaimCreate(BaseModel):
    status: ClaimStatus = Field(default=ClaimStatus.WANT_TO_BUY)
    notes: Optional[str] = Field(None, max_length=500, description="Secret note visible only to non-owners")


class ItemClaimUpdate(BaseModel):
    status: Optional[ClaimStatus] = None
    notes: Optional[str] = None


class ItemClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    claimed_by_id: int
    claimed_by_alias: Optional[str] = None
    claimed_by_avatar: Optional[str] = "🎁"
    status: ClaimStatus
    notes: Optional[str] = None
    is_claimed_by_viewer: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None


class ItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    alt_url: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None
    priority: ItemPriority
    is_on_sale: bool = False
    is_archived: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Conditional Privacy Fields
    is_owner: bool
    # IMPORTANT: Stripped (None) whenever is_owner == True
    claim: Optional[ItemClaimResponse] = None
