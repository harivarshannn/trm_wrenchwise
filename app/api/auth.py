"""API routes for authorization and admin access controls."""

from __future__ import annotations

import hashlib
import os
import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserRead, UserApprove
from app.schemas.common import APIResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}:{key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    if ":" not in hashed:
        return False
    salt, key_hex = hashed.split(":", 1)
    new_key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return new_key.hex() == key_hex


@router.post("/register", response_model=APIResponse[UserRead])
async def register(payload: UserRegister, session: AsyncSession = Depends(get_session)):
    # Check if username exists
    existing = await session.execute(select(User).where(User.username == payload.username.strip()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered."
        )

    # First user is superadmin, others are normal inactive admins
    total_users = await session.execute(select(User))
    is_first = len(total_users.scalars().all()) == 0

    new_user = User(
        username=payload.username.strip(),
        password_hash=hash_password(payload.password),
        role="superior_admin" if is_first else "admin",
        is_active=True if is_first else False
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return APIResponse(success=True, message="Registration successful.", data=UserRead.model_validate(new_user))


@router.post("/login", response_model=APIResponse[UserRead])
async def login(payload: UserLogin, session: AsyncSession = Depends(get_session)):
    stmt = select(User).where(User.username == payload.username.strip())
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending Superior Admin approval."
        )

    return APIResponse(success=True, message="Login successful.", data=UserRead.model_validate(user))


@router.get("/users", response_model=APIResponse[list[UserRead]])
async def list_users(session: AsyncSession = Depends(get_session)):
    stmt = select(User).order_by(User.created_at.desc())
    result = await session.execute(stmt)
    users = result.scalars().all()
    return APIResponse(success=True, message="Users list fetched.", data=[UserRead.model_validate(u) for u in users])


@router.post("/users/{user_id}/approve", response_model=APIResponse[UserRead])
async def approve_user(user_id: uuid.UUID, payload: UserApprove, session: AsyncSession = Depends(get_session)):
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    user.is_active = payload.is_active
    await session.commit()
    await session.refresh(user)

    status_str = "approved" if payload.is_active else "revoked"
    return APIResponse(success=True, message=f"User access successfully {status_str}.", data=UserRead.model_validate(user))


@router.post("/reset-superadmin", response_model=APIResponse[dict])
async def reset_superadmin(session: AsyncSession = Depends(get_session)):
    stmt = select(User).where(User.username == "wrenchwise")
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            id=uuid.uuid4(),
            username="wrenchwise",
            password_hash=hash_password("wrenchwise@2026"),
            role="superior_admin",
            is_active=True
        )
        session.add(user)
    else:
        user.password_hash = hash_password("wrenchwise@2026")
        user.role = "superior_admin"
        user.is_active = True
        
    await session.commit()
    return APIResponse(success=True, message="Super admin password successfully reset to wrenchwise@2026", data={})
