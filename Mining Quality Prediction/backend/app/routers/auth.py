from fastapi import APIRouter, HTTPException, status

from app.schemas import LoginRequest, TokenResponse
from app.services.auth import authenticate_user, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = authenticate_user(body.email, body.password, body.role)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email, password, or role",
        )
    token = create_access_token(
        {"sub": user["email"], "role": user["role"], "name": user["name"]}
    )
    return TokenResponse(
        access_token=token,
        role=user["role"],
        name=user["name"],
    )
