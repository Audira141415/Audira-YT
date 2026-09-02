import uuid
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.license import License
from app.models.user import User

router = APIRouter()

class LicenseGenerateRequest(BaseModel):
    duration_type: str # '7_DAYS', '1_MONTH', 'PERMANENT'
    client_name: Optional[str] = "Audira Enterprise Client"
    client_email: Optional[str] = "client@audira.com"
    max_channels: Optional[int] = 6
    notes: Optional[str] = None
    activate_immediately: Optional[bool] = True
    custom_key: Optional[str] = None

class LicenseActivateRequest(BaseModel):
    license_key: str
    client_email: Optional[str] = None

class LicenseUpdateRequest(BaseModel):
    duration_type: Optional[str] = None # '7_DAYS', '1_MONTH', 'PERMANENT'
    status: Optional[str] = None # 'ACTIVE', 'UNUSED', 'EXPIRED', 'REVOKED'
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    max_channels: Optional[int] = None
    extend_days: Optional[int] = None
    notes: Optional[str] = None

def generate_formatted_license_key(duration_type: str) -> str:
    prefix_map = {
        "7_DAYS": "AUD-7D",
        "1_MONTH": "AUD-1M",
        "PERMANENT": "AUD-LIFE"
    }
    prefix = prefix_map.get(duration_type.upper(), "AUD-PRO")
    
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '') # Avoid confusing chars
    
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    part3 = ''.join(secrets.choice(chars) for _ in range(4))
    
    return f"{prefix}-{part1}-{part2}-{part3}"

def format_license_response(lic: License):
    now = datetime.now(timezone.utc)
    
    # Check expiry
    is_expired = False
    remaining_days = 99999
    remaining_text = "Aktif Selamanya (Permanen)"
    
    if lic.duration_type == "PERMANENT":
        remaining_days = 99999
        remaining_text = "LIFETIME (PERMANEN)"
    elif lic.expires_at:
        exp = lic.expires_at if lic.expires_at.tzinfo else lic.expires_at.replace(tzinfo=timezone.utc)
        diff = exp - now
        days = diff.days
        hours = int(diff.seconds / 3600)
        
        if diff.total_seconds() <= 0:
            is_expired = True
            remaining_days = 0
            remaining_text = "Sudah Kadaluarsa"
        else:
            remaining_days = max(0, days)
            if days > 0:
                remaining_text = f"{days} Hari Lagi"
            else:
                remaining_text = f"{hours} Jam Lagi"
    else:
        remaining_text = "Belum Diaktifkan"

    current_status = lic.status
    if is_expired and current_status == "ACTIVE":
        current_status = "EXPIRED"

    duration_label_map = {
        "7_DAYS": "7 HARI (TRIAL)",
        "1_MONTH": "1 BULAN (PRO)",
        "PERMANENT": "PERMANEN (LIFETIME)"
    }

    return {
        "id": str(lic.id),
        "license_key": lic.license_key,
        "duration_type": lic.duration_type,
        "duration_label": duration_label_map.get(lic.duration_type, lic.duration_type),
        "status": current_status,
        "client_name": lic.client_name or "Client Audira",
        "client_email": lic.client_email or "-",
        "max_channels": lic.max_channels or 6,
        "features": lic.features or "ALL_FEATURES",
        "is_active": (current_status == "ACTIVE"),
        "activated_at": lic.activated_at.strftime("%b %d, %Y %H:%M") if lic.activated_at else "-",
        "expires_at": lic.expires_at.strftime("%b %d, %Y %H:%M") if lic.expires_at else ("SELAMANYA (LIFETIME)" if lic.duration_type == "PERMANENT" else "-"),
        "created_at": lic.created_at.strftime("%b %d, %Y %H:%M") if lic.created_at else "-",
        "remaining_days": remaining_days,
        "remaining_text": remaining_text,
        "notes": lic.notes or ""
    }

def seed_default_licenses_if_empty(db: Session):
    if db.query(License).count() == 0:
        now = datetime.now(timezone.utc)
        
        # 1. Official Enterprise Permanent Lifetime License (Active for Audira YT)
        lic_life = License(
            id=uuid.uuid4(),
            license_key="AUD-LIFE-9999-AUDIRA-PRO",
            duration_type="PERMANENT",
            status="ACTIVE",
            client_name="Agus Dwi Rianto (Superadmin)",
            client_email="audirasuksesmandiri@gmail.com",
            max_channels=99,
            features="ALL_FEATURES",
            is_active=True,
            activated_at=now - timedelta(days=3),
            expires_at=None,
            notes="Lisensi Utama Sistem Audira YT Pro Enterprise (Aktif Selamanya)"
        )
        
        # 2. 1 Month Pro License
        lic_1m = License(
            id=uuid.uuid4(),
            license_key="AUD-1M-8421-K9X2-P4M1",
            duration_type="1_MONTH",
            status="ACTIVE",
            client_name="Media Partner Studio",
            client_email="partner.studio@audira.com",
            max_channels=12,
            features="ALL_FEATURES",
            is_active=True,
            activated_at=now - timedelta(days=2),
            expires_at=now + timedelta(days=28),
            notes="Paket Langganan 1 Bulan Multi-Channel"
        )
        
        # 3. 7 Days Trial License
        lic_7d = License(
            id=uuid.uuid4(),
            license_key="AUD-7D-3190-V7B8-Q2W5",
            duration_type="7_DAYS",
            status="ACTIVE",
            client_name="Digital Creator Trial",
            client_email="trial.creator@gmail.com",
            max_channels=6,
            features="ALL_FEATURES",
            is_active=True,
            activated_at=now - timedelta(days=1),
            expires_at=now + timedelta(days=6),
            notes="Paket Uji Coba 7 Hari Akses Penuh"
        )

        # 4. Unused Ready-to-Use 1 Month License
        lic_unused = License(
            id=uuid.uuid4(),
            license_key="AUD-1M-5531-R9T2-M8L0",
            duration_type="1_MONTH",
            status="UNUSED",
            client_name="Klien Baru Siap Pakai",
            client_email="client.baru@example.com",
            max_channels=6,
            features="ALL_FEATURES",
            is_active=False,
            activated_at=None,
            expires_at=None,
            notes="Kunci lisensi baru siap dibagikan ke pengguna"
        )

        db.add_all([lic_life, lic_1m, lic_7d, lic_unused])
        db.commit()

@router.get("")
def list_licenses(
    status: Optional[str] = None,
    duration: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all generated licenses with duration and remaining days calculation.
    """
    seed_default_licenses_if_empty(db)
    
    query = db.query(License)
    
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (License.license_key.ilike(s)) |
            (License.client_name.ilike(s)) |
            (License.client_email.ilike(s))
        )
        
    if duration and duration != "ALL":
        query = query.filter(License.duration_type == duration.upper())
        
    if status and status != "ALL":
        query = query.filter(License.status == status.upper())
        
    licenses = query.order_by(License.created_at.desc()).all()
    
    all_lics = db.query(License).all()
    stats = {
        "total": len(all_lics),
        "permanent_count": sum(1 for l in all_lics if l.duration_type == "PERMANENT"),
        "one_month_count": sum(1 for l in all_lics if l.duration_type == "1_MONTH"),
        "seven_days_count": sum(1 for l in all_lics if l.duration_type == "7_DAYS"),
        "active_count": sum(1 for l in all_lics if l.status == "ACTIVE"),
        "unused_count": sum(1 for l in all_lics if l.status == "UNUSED"),
        "expired_count": sum(1 for l in all_lics if l.status in ["EXPIRED", "REVOKED"])
    }
    
    formatted_list = [format_license_response(l) for l in licenses]
    
    return {
        "status": "SUCCESS",
        "stats": stats,
        "total": len(formatted_list),
        "licenses": formatted_list
    }

@router.get("/current")
def get_current_system_license(db: Session = Depends(get_db)):
    """
    Get current active system license for Audira YT.
    """
    seed_default_licenses_if_empty(db)
    
    # Priority: Permanent > Active 1 Month > Active 7 Days > Any Active
    perm = db.query(License).filter(License.duration_type == "PERMANENT", License.status == "ACTIVE").first()
    if perm:
        return {"status": "SUCCESS", "license": format_license_response(perm)}
        
    active_lic = db.query(License).filter(License.status == "ACTIVE").order_by(License.created_at.desc()).first()
    if active_lic:
        return {"status": "SUCCESS", "license": format_license_response(active_lic)}
        
    first_lic = db.query(License).first()
    if first_lic:
        return {"status": "SUCCESS", "license": format_license_response(first_lic)}
        
    return {"status": "ERROR", "message": "No active license found on system"}

@router.post("/generate")
def generate_license(
    req: LicenseGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a new license key with selected duration: 7_DAYS, 1_MONTH, or PERMANENT.
    """
    dur_type = req.duration_type.upper().strip()
    if dur_type not in ["7_DAYS", "1_MONTH", "PERMANENT"]:
        dur_type = "1_MONTH"
        
    key = req.custom_key.strip() if (req.custom_key and req.custom_key.strip()) else generate_formatted_license_key(dur_type)
    
    # Check if key already exists
    existing = db.query(License).filter(License.license_key == key).first()
    if existing:
        key = generate_formatted_license_key(dur_type)
        
    now = datetime.now(timezone.utc)
    
    expires_at = None
    activated_at = None
    initial_status = "UNUSED"
    
    if req.activate_immediately:
        initial_status = "ACTIVE"
        activated_at = now
        if dur_type == "7_DAYS":
            expires_at = now + timedelta(days=7)
        elif dur_type == "1_MONTH":
            expires_at = now + timedelta(days=30)
        elif dur_type == "PERMANENT":
            expires_at = None
            
    new_license = License(
        id=uuid.uuid4(),
        license_key=key,
        duration_type=dur_type,
        status=initial_status,
        client_name=req.client_name or "Client Audira",
        client_email=req.client_email or "",
        max_channels=req.max_channels or (99 if dur_type == "PERMANENT" else 6),
        features="ALL_FEATURES",
        is_active=(initial_status == "ACTIVE"),
        activated_at=activated_at,
        expires_at=expires_at,
        notes=req.notes or f"Dibuat pada {now.strftime('%d %b %Y')}"
    )
    
    db.add(new_license)
    db.commit()
    db.refresh(new_license)
    
    return {
        "status": "SUCCESS",
        "message": f"Lisensi {new_license.duration_type} berhasil digenerate!",
        "license": format_license_response(new_license)
    }

@router.post("/activate")
def activate_license(
    req: LicenseActivateRequest,
    db: Session = Depends(get_db)
):
    """
    Activate a license key on the system.
    """
    clean_key = req.license_key.strip().upper()
    lic = db.query(License).filter(License.license_key.ilike(clean_key)).first()
    
    if not lic:
        raise HTTPException(status_code=404, detail="Kunci lisensi tidak valid atau tidak ditemukan dalam database!")
        
    if lic.status == "REVOKED":
        raise HTTPException(status_code=400, detail="Kunci lisensi ini telah dicabut/dinonaktifkan oleh Administrator.")
        
    now = datetime.now(timezone.utc)
    
    # Calculate expiry
    lic.status = "ACTIVE"
    lic.is_active = True
    lic.activated_at = now
    
    if lic.duration_type == "7_DAYS":
        lic.expires_at = now + timedelta(days=7)
    elif lic.duration_type == "1_MONTH":
        lic.expires_at = now + timedelta(days=30)
    elif lic.duration_type == "PERMANENT":
        lic.expires_at = None
        
    if req.client_email and not lic.client_email:
        lic.client_email = req.client_email.strip()
        
    db.commit()
    db.refresh(lic)
    
    return {
        "status": "SUCCESS",
        "message": f"🎉 Aktivasi Lisensi {lic.duration_type} Berhasil!",
        "license": format_license_response(lic)
    }

@router.post("/verify")
def verify_license(
    req: LicenseActivateRequest,
    db: Session = Depends(get_db)
):
    """
    Verify license key validity.
    """
    clean_key = req.license_key.strip().upper()
    lic = db.query(License).filter(License.license_key.ilike(clean_key)).first()
    
    if not lic:
        return {"valid": False, "message": "Kunci lisensi tidak ditemukan."}
        
    formatted = format_license_response(lic)
    return {
        "valid": formatted["is_active"] and formatted["status"] == "ACTIVE",
        "license": formatted
    }

@router.patch("/{license_id}")
def update_license(
    license_id: str,
    req: LicenseUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update or extend a license.
    """
    try:
        u_id = uuid.UUID(license_id)
        lic = db.query(License).filter(License.id == u_id).first()
    except Exception:
        lic = db.query(License).filter(License.license_key == license_id).first()
        
    if not lic:
        raise HTTPException(status_code=404, detail="Lisensi tidak ditemukan.")
        
    now = datetime.now(timezone.utc)
    
    if req.duration_type:
        new_dur = req.duration_type.upper().strip()
        if new_dur in ["7_DAYS", "1_MONTH", "PERMANENT"]:
            lic.duration_type = new_dur
            if new_dur == "PERMANENT":
                lic.expires_at = None
                lic.status = "ACTIVE"
            elif new_dur == "1_MONTH":
                lic.expires_at = now + timedelta(days=30)
                lic.status = "ACTIVE"
            elif new_dur == "7_DAYS":
                lic.expires_at = now + timedelta(days=7)
                lic.status = "ACTIVE"
                
    if req.status:
        lic.status = req.status.upper()
        lic.is_active = (lic.status == "ACTIVE")
        
    if req.client_name is not None:
        lic.client_name = req.client_name.strip()
    if req.client_email is not None:
        lic.client_email = req.client_email.strip()
    if req.max_channels is not None:
        lic.max_channels = req.max_channels
    if req.notes is not None:
        lic.notes = req.notes
        
    if req.extend_days and req.extend_days > 0 and lic.duration_type != "PERMANENT":
        base_date = lic.expires_at if (lic.expires_at and lic.expires_at > now) else now
        lic.expires_at = base_date + timedelta(days=req.extend_days)
        lic.status = "ACTIVE"
        lic.is_active = True
        
    db.commit()
    db.refresh(lic)
    
    return {
        "status": "SUCCESS",
        "message": "Lisensi berhasil diperbarui!",
        "license": format_license_response(lic)
    }

@router.delete("/{license_id}")
def delete_license(
    license_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a license record.
    """
    try:
        u_id = uuid.UUID(license_id)
        lic = db.query(License).filter(License.id == u_id).first()
    except Exception:
        lic = db.query(License).filter(License.license_key == license_id).first()
        
    if not lic:
        raise HTTPException(status_code=404, detail="Lisensi tidak ditemukan.")
        
    db.delete(lic)
    db.commit()
    
    return {"status": "SUCCESS", "message": "Lisensi berhasil dihapus dari database."}
