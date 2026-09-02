import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.google_account import GoogleAccount
from app.models.youtube_channel import YouTubeChannel
from app.core.security import get_password_hash

router = APIRouter()

class UserCreateRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "USER"  # SUPERADMIN, ADMIN, MANAGER, VIEWER, USER
    status: str = "ACTIVE"  # ACTIVE, SUSPENDED

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None # SUPERADMIN, ADMIN, MANAGER, VIEWER
    status: Optional[str] = None # ACTIVE, SUSPENDED

class PasswordResetRequest(BaseModel):
    new_password: str

ROLE_PERMISSIONS_MATRIX = {
    "SUPERADMIN": {
        "title": "SUPERADMIN (OWNER / FULL ACCESS)",
        "badge": "👑 SUPERADMIN",
        "color": "bg-yellow-300 text-black",
        "description": "Akses Penuh Total: Manajemen User & Role, Pendapatan IDR, Lisensi, OAuth Credentials, Telegram Bot, Pengaturan Server, & Reset DB.",
        "permissions": [
            "Akses Penuh Semua Menu & Pengaturan Sistem",
            "Kelola Lisensi (Permanen, 1 Bulan, 7 Hari)",
            "Kelola Akun Terdaftar & Ubah Hak Akses (Role)",
            "Akses Data Finansial & Estimasi Pendapatan IDR",
            "Kelola Kunci Google OAuth & API Server",
            "Kirim Notifikasi & Backup Database via Telegram",
            "Hapus Akun Google & Channel YouTube"
        ]
    },
    "ADMIN": {
        "title": "ADMINISTRATOR (SYSTEM OPERATOR)",
        "badge": "🛡️ ADMIN",
        "color": "bg-emerald-300 text-black",
        "description": "Akses Administrator: Manajemen Channel, Trigger Sync Pipeline, Manajemen Komentar, & Laporan Analytics.",
        "permissions": [
            "Kelola Seluruh Akun Google & Channel YouTube",
            "Trigger Eksekusi Pipa Sinkronisasi Realtime",
            "Jadwalkan Postingan & Balas Komentar Otomatis",
            "Akses Radar Kompetitor & Analisis Tren",
            "Ekspor Laporan CSV & JSON",
            "Lihat Status Lisensi Aktif (Read Only)"
        ]
    },
    "MANAGER": {
        "title": "MANAGER / EDITOR (CONTENT & OPERATIONS)",
        "badge": "🎬 MANAGER",
        "color": "bg-cyan-200 text-black",
        "description": "Akses Operasional Konten: Upload Video, Jadwal Publikasi, & Pemantauan Performa Video (Tanpa Akses Data Pendapatan).",
        "permissions": [
            "Lihat & Pantau Daftar Video & Channel",
            "Jadwalkan Konten & Auto-Publishing Video",
            "Moderasi & Balas Komentar YouTube",
            "Lihat Realtime Analytics Views & Subscribers",
            "Proteksi: Tidak Dapat Mengubah Pengaturan OAuth & Lisensi"
        ]
    },
    "VIEWER": {
        "title": "VIEWER / CLIENT (READ-ONLY ANALYTICS)",
        "badge": "👁️ VIEWER",
        "color": "bg-purple-200 text-black",
        "description": "Akses Baca Saja (Read-Only): Pemantauan grafik, milestone subscriber, & unduh laporan eksekutif.",
        "permissions": [
            "Lihat Dashboard Ringkasan Eksekutif",
            "Lihat Grafik Tren & Perbandingan Channel",
            "Unduh Laporan Format PDF & Excel",
            "Proteksi: Tidak Dapat Mengubah Data Sistem Apapun"
        ]
    }
}

@router.get("/roles")
def get_role_matrix():
    """
    Get detailed RBAC matrix and role definitions.
    """
    return {
        "status": "SUCCESS",
        "roles": ROLE_PERMISSIONS_MATRIX
    }

@router.get("")
def list_registered_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all registered users from database with filter & stats breakdown.
    """
    users = db.query(User).all()
    
    # Auto-seed default Superadmin if empty
    if not users:
        admin_user = User(
            id=uuid.uuid4(),
            email="audira@audira.com",
            name="Audira Superadmin",
            hashed_password=get_password_hash("Sigma1993"),
            role="SUPERADMIN",
            status="ACTIVE"
        )
        editor_user = User(
            id=uuid.uuid4(),
            email="editor.media@audira.com",
            name="Video Production Lead",
            hashed_password=get_password_hash("Editor123!"),
            role="MANAGER",
            status="ACTIVE"
        )
        viewer_user = User(
            id=uuid.uuid4(),
            email="partner.client@audira.com",
            name="Executive Partner Viewer",
            hashed_password=get_password_hash("Viewer123!"),
            role="VIEWER",
            status="ACTIVE"
        )
        db.add_all([admin_user, editor_user, viewer_user])
        db.commit()
        users = db.query(User).all()

    query = db.query(User)
    
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((User.email.ilike(s)) | (User.name.ilike(s)))
        
    if role and role != "ALL":
        query = query.filter(User.role == role.upper())
        
    if status and status != "ALL":
        query = query.filter(User.status == status.upper())
        
    filtered_users = query.order_by(User.created_at.desc()).all()
    
    all_users = db.query(User).all()
    stats = {
        "total": len(all_users),
        "superadmin_count": sum(1 for u in all_users if (u.role or "").upper() in ["SUPERADMIN", "OWNER"]),
        "admin_count": sum(1 for u in all_users if (u.role or "").upper() == "ADMIN"),
        "manager_count": sum(1 for u in all_users if (u.role or "").upper() in ["MANAGER", "EDITOR"]),
        "viewer_count": sum(1 for u in all_users if (u.role or "").upper() == "VIEWER"),
        "active_count": sum(1 for u in all_users if (u.status or "ACTIVE").upper() == "ACTIVE"),
        "suspended_count": sum(1 for u in all_users if (u.status or "").upper() in ["SUSPENDED", "INACTIVE"])
    }
    
    result = []
    for u in filtered_users:
        u_role = (u.role or "MANAGER").upper()
        if u_role == "OWNER":
            u_role = "SUPERADMIN"
        elif u_role == "EDITOR":
            u_role = "MANAGER"
            
        result.append({
            "id": str(u.id),
            "name": u.name or u.email.split("@")[0].upper(),
            "email": u.email,
            "role": u_role,
            "role_info": ROLE_PERMISSIONS_MATRIX.get(u_role, ROLE_PERMISSIONS_MATRIX["MANAGER"]),
            "status": (u.status or "ACTIVE").upper(),
            "has_password": bool(u.hashed_password),
            "created_at": u.created_at.strftime("%b %d, %Y %H:%M") if u.created_at else "-",
            "initials": "".join([part[0] for part in (u.name or u.email).split()[:2]]).upper()
        })

    return {
        "status": "SUCCESS",
        "stats": stats,
        "total": len(result),
        "users": result
    }

@router.post("")
def create_registered_user(
    req: UserCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Register and create a new user account with assigned role.
    """
    clean_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Email '{clean_email}' sudah terdaftar dalam sistem.")

    role_clean = req.role.upper().strip()
    if role_clean not in ROLE_PERMISSIONS_MATRIX:
        role_clean = "MANAGER"
        
    status_clean = req.status.upper().strip()
    if status_clean not in ["ACTIVE", "SUSPENDED"]:
        status_clean = "ACTIVE"

    new_user = User(
        id=uuid.uuid4(),
        email=clean_email,
        name=req.name.strip() or clean_email.split("@")[0].capitalize(),
        hashed_password=get_password_hash(req.password.strip()),
        role=role_clean,
        status=status_clean
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "SUCCESS",
        "message": f"Pengguna '{new_user.name}' ({new_user.email}) berhasil didaftarkan sebagai {new_user.role}!",
        "user_id": str(new_user.id)
    }

@router.patch("/{user_id}")
def update_user_details(
    user_id: str,
    req: UserUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update registered user's role, name, email, or status.
    """
    try:
        u_uuid = uuid.UUID(user_id)
        user = db.query(User).filter(User.id == u_uuid).first()
    except Exception:
        user = db.query(User).filter(User.email == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan dalam database.")

    if req.name is not None and req.name.strip():
        user.name = req.name.strip()
        
    if req.email is not None and req.email.strip():
        new_email = req.email.strip().lower()
        if new_email != user.email:
            existing = db.query(User).filter(User.email == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Email '{new_email}' sudah digunakan pengguna lain.")
            user.email = new_email

    if req.role is not None:
        role_clean = req.role.upper().strip()
        if role_clean in ROLE_PERMISSIONS_MATRIX:
            user.role = role_clean

    if req.status is not None:
        status_clean = req.status.upper().strip()
        if status_clean in ["ACTIVE", "SUSPENDED"]:
            user.status = status_clean

    db.commit()
    db.refresh(user)

    return {
        "status": "SUCCESS",
        "message": f"Data pengguna '{user.name}' berhasil diperbarui! Role: {user.role}, Status: {user.status}",
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status
        }
    }

@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    req: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password for a registered user account.
    """
    try:
        u_uuid = uuid.UUID(user_id)
        user = db.query(User).filter(User.id == u_uuid).first()
    except Exception:
        user = db.query(User).filter(User.email == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    if not req.new_password or len(req.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Kata sandi baru minimal harus 4 karakter.")

    user.hashed_password = get_password_hash(req.new_password.strip())
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Kata sandi untuk pengguna '{user.name}' ({user.email}) berhasil di-reset!"
    }

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a registered user account.
    """
    try:
        u_uuid = uuid.UUID(user_id)
        user = db.query(User).filter(User.id == u_uuid).first()
    except Exception:
        user = db.query(User).filter(User.email == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    # Prevent deleting superadmin if only 1 superadmin left
    if (user.role or "").upper() in ["SUPERADMIN", "OWNER"]:
        super_count = db.query(User).filter(User.role.in_(["SUPERADMIN", "OWNER"])).count()
        if super_count <= 1:
            raise HTTPException(status_code=400, detail="Tidak dapat menghapus SUPERADMIN terakhir dari sistem.")

    db.delete(user)
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Akun pengguna '{user.name}' ({user.email}) berhasil dihapus."
    }
