from fastapi import Depends, HTTPException, status
from typing import List

from app.api.deps import get_current_user
from app.models.user import User

def require_role(allowed_roles: List[str]):
    """
    Dependency decorator enforcing Role-Based Access Control (RBAC).
    Allowed roles: 'OWNER', 'EDITOR', 'VIEWER'
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        user_role = (current_user.role or "OWNER").upper()
        allowed_upper = [r.upper() for r in allowed_roles]
        
        if user_role not in allowed_upper:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {allowed_roles}, your role: {user_role}"
            )
        return current_user

    return role_checker
