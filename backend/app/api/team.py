from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_active_user, require_admin_or_above

router = APIRouter()

ROLE_BADGE = {
    "SUPERADMIN": "👑 SUPERADMIN",
    "ADMIN": "🛡️ ADMIN",
    "MANAGER": "🎬 MANAGER",
    "VIEWER": "👁️ VIEWER",
    "USER": "👤 USER",
    # Legacy aliases
    "OWNER": "👑 OWNER",
    "EDITOR": "🎬 EDITOR",
}

class MemberInviteRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = "Team Member"
    role: str = "VIEWER"  # ADMIN, MANAGER, VIEWER — cannot self-assign SUPERADMIN

class MemberRoleUpdateRequest(BaseModel):
    role: str
    status: Optional[str] = "ACTIVE"

@router.get("/members")
def get_team_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)  # 🔐 ADMIN+ only
):
    """
    Get list of team members with assigned RBAC roles.
    Only ADMIN and SUPERADMIN can view the full member list.
    """
    users = db.query(User).all()

    members = []
    for u in users:
        members.append({
            "id": str(u.id),
            "email": u.email,
            "name": u.name or "Audira Member",
            "role": u.role or "USER",
            "badge": ROLE_BADGE.get((u.role or "USER").upper(), "👤 USER"),
            "status": getattr(u, 'status', 'ACTIVE') or 'ACTIVE',
            "createdAt": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "2026-08-30 00:00"
        })

    return {
        "status": "SUCCESS",
        "totalMembers": len(members),
        "roleMatrix": {
            "SUPERADMIN": "Akses Penuh + Revenue IDR + Settings Server + OAuth Credentials",
            "ADMIN": "Akses Administrator: Sync Pipeline, Analytics, Kompetiitor Radar",
            "MANAGER": "Konten: Upload Video, Jadwal Publikasi, Moderasi Komentar (No Revenue)",
            "VIEWER": "Read-Only Dashboard Analytics & Laporan"
        },
        "members": members
    }

@router.post("/invite")
def invite_team_member(
    req: MemberInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)  # 🔐 ADMIN+ only
):
    """
    Invite a new team member with specified role.
    Cannot assign SUPERADMIN via this endpoint.
    """
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ini sudah terdaftar dalam sistem.")

    # 🔐 SECURITY: Cannot self-assign or assign SUPERADMIN via invite
    allowed_roles = {"ADMIN", "MANAGER", "VIEWER", "EDITOR", "USER"}
    role_upper = req.role.upper()
    if role_upper not in allowed_roles:
        role_upper = "VIEWER"

    new_user = User(
        email=req.email,
        name=req.name,
        role=role_upper,
        status="ACTIVE"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "SUCCESS",
        "message": f"Member {req.email} berhasil diundang sebagai {role_upper}!",
        "user_id": str(new_user.id)
    }

@router.patch("/members/{member_id}/role")
def update_member_role(
    member_id: str,
    req: MemberRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)  # 🔐 ADMIN+ only
):
    """
    Update RBAC role or status of a team member.
    Only ADMIN or SUPERADMIN can modify roles.
    ADMIN cannot promote to SUPERADMIN — only SUPERADMIN can.
    """
    try:
        uuid_obj = uuid.UUID(member_id)
        user = db.query(User).filter(User.id == uuid_obj).first()
    except Exception:
        user = db.query(User).filter(User.email == member_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Team member tidak ditemukan.")

    new_role = req.role.upper()
    # 🔐 Only SUPERADMIN can assign SUPERADMIN role
    if new_role == "SUPERADMIN":
        caller_role = (getattr(current_user, 'role', '') or '').upper()
        if caller_role != "SUPERADMIN":
            raise HTTPException(
                status_code=403,
                detail="Hanya SUPERADMIN yang dapat memberikan role SUPERADMIN kepada user lain."
            )

    user.role = new_role
    if req.status:
        user.status = req.status.upper()

    db.commit()
    return {"status": "SUCCESS", "message": f"Role member diperbarui menjadi {user.role}"}

@router.delete("/members/{member_id}")
def remove_team_member(
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)  # 🔐 ADMIN+ only
):
    """
    Remove a team member.
    """
    try:
        uuid_obj = uuid.UUID(member_id)
        user = db.query(User).filter(User.id == uuid_obj).first()
    except Exception:
        user = db.query(User).filter(User.email == member_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Team member tidak ditemukan.")

    # 🔐 Cannot remove yourself
    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Anda tidak dapat menghapus akun Anda sendiri.")

    db.delete(user)
    db.commit()
    return {"status": "SUCCESS", "message": f"Member {member_id} berhasil dihapus."}
