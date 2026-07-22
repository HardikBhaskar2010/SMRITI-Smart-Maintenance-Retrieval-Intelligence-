"""JWT Authentication — demo-mode with hardcoded users."""
import logging
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

try:
    from jose import JWTError, jwt
except ImportError:
    jwt = None  # type: ignore
    JWTError = Exception  # type: ignore

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
bearer = HTTPBearer(auto_error=False)

# ── Demo Users ─────────────────────────────────────────────────────────
DEMO_USERS = {
    "admin": {
        "password": "smriti2026",
        "role": "admin",
        "name": "SMRITI Admin",
        "email": "admin@smriti.ai",
    },
    "engineer": {
        "password": "engineer123",
        "role": "engineer",
        "name": "Field Engineer",
        "email": "engineer@smriti.ai",
    },
    "viewer": {
        "password": "viewer123",
        "role": "viewer",
        "name": "Read-Only Viewer",
        "email": "viewer@smriti.ai",
    },
}


def _create_token(username: str, role: str) -> str:
    if jwt is None:
        return f"demo-token-{username}"
    expire = datetime.now(UTC) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": username,
        "role": role,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _verify_token(token: str) -> dict:
    if jwt is None:
        # Fallback: parse "demo-token-{username}"
        username = token.replace("demo-token-", "")
        user = DEMO_USERS.get(username)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"sub": username, "role": user["role"]}
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    """FastAPI dependency — validates JWT and returns current user payload."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return _verify_token(credentials.credentials)


def require_role(*roles: str):
    """Dependency factory — requires one of the given roles."""
    def _check(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {' or '.join(roles)}",
            )
        return user
    return _check


# ── Routes ──────────────────────────────────────────────────────────────

@router.post("/auth/login")
def login(body: dict):
    """
    POST /api/auth/login
    Body: {"username": "admin", "password": "smriti2026"}
    """
    username = body.get("username", "").lower().strip()
    password = body.get("password", "")
    user = DEMO_USERS.get(username)
    if not user or user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _create_token(username, user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
        "user": {
            "username": username,
            "name": user["name"],
            "role": user["role"],
            "email": user["email"],
        },
    }


@router.get("/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    username = user.get("sub", "")
    demo = DEMO_USERS.get(username, {})
    return {
        "username": username,
        "role": user.get("role", "viewer"),
        "name": demo.get("name", username),
        "email": demo.get("email", ""),
    }


@router.post("/auth/logout")
def logout():
    """Client-side logout — instruct client to discard token."""
    return {"message": "Logged out. Discard your token."}
