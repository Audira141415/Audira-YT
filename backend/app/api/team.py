from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.user import User

router = APIRouter()

class MemberInviteRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = "Team Member"
    role: str = "EDITOR" # OWNER, EDITOR, VIEWER

class MemberRoleUpdateRequest(BaseModel):
    role: str # OWNER, EDITOR, VIEWER
    status: Optional[str] = "ACTIVE" # ACTIVE, SUSPENDED

@router.get("/members")
def get_team_members(
    db: Session = Depends(get_db)
):
    """
    Get list of team members with assigned RBAC roles.
    """
    users = db.query(User).all()
    
    # If database has no users, seed default admin & team demo members
    if not users:
        owner = User(
            email="superadmin@audira.com",
            name="Audira Super Admin",
            role="OWNER",
            status="ACTIVE"
        )
        editor = User(
            email="editor.media@audira.com",
            name="Video Production Lead",
            role="EDITOR",
            status="ACTIVE"
        )
        viewer = User(
            email="client.partner@audira.com",
            name="Executive Partner Viewer",
            role="VIEWER",
            status="ACTIVE"
        )
        db.add_all([owner, editor, viewer])
        db.commit()
        users = db.query(User).all()

    members = []
    for u in users:
        members.append({
            "id": str(u.id),
            "email": u.email,
            "name": u.name or "Audira Member",
            "role": u.role or "OWNER",
            "status": getattr(u, 'status', 'ACTIVE') or 'ACTIVE',
            "createdAt": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "2026-08-30 00:00"
        })

    return {
        "status": "SUCCESS",
        "totalMembers": len(members),
        "roleMatrix": {
            "OWNER": "Akses Penuh + Revenue IDR + Settings Server + OAuth Credentials",
            "EDITOR": "Akses Dashboard + Upload Video + Moderate Komentar (No Revenue)",
            "VIEWER": "Read-Only Dashboard Analytics & Laporan"
        },
        "members": members
    }

@router.post("/invite")
def invite_team_member(
    req: MemberInviteRequest,
    db: Session = Depends(get_db)
):
    """
    Invite a new team member with specified role.
    """
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email is already a member of this team")

    role_upper = req.role.upper()
    if role_upper not in ["OWNER", "EDITOR", "VIEWER"]:
        role_upper = "EDITOR"

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
        "message": f"Member {req.email} successfully invited as {role_upper}!",
        "user_id": str(new_user.id)
    }

@router.patch("/members/{member_id}/role")
def update_member_role(
    member_id: str,
    req: MemberRoleUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update RBAC role or status of a team member.
    """
    try:
        uuid_obj = uuid.UUID(member_id)
        user = db.query(User).filter(User.id == uuid_obj).first()
    except Exception:
        user = db.query(User).filter(User.email == member_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Team member not found")

    user.role = req.role.upper()
    if req.status:
        user.status = req.status.upper()

    db.commit()
    return {"status": "SUCCESS", "message": f"Member role updated to {user.role}"}

@router.delete("/members/{member_id}")
def remove_team_member(
    member_id: str,
    db: Session = Depends(get_db)
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
        raise HTTPException(status_code=404, detail="Team member not found")

    db.delete(user)
    db.commit()
    return {"status": "SUCCESS", "message": f"Member {member_id} removed."}
