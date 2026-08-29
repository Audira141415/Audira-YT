from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.api.deps import get_current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current user has 'admin' role.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

def require_manager(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure the current user has at least 'manager' role.
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
