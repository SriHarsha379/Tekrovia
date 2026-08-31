"""
Auth / OTP router — lead developer owns this (core business logic + Candidate ID generation).
Stubbed here so the fresher has a real contract to build the login UI against.
Wire up an actual OTP provider (MSG91/Twilio/Firebase) and JWT issuance before shipping.
"""

import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])


class OTPRequest(BaseModel):
    identifier: str  # phone or email


class OTPVerifyRequest(BaseModel):
    identifier: str
    otp_code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    candidate_id: uuid.UUID | None = None
    is_new_candidate: bool = False


@router.post("/otp/request")
def request_otp(payload: OTPRequest):
    # TODO: generate OTP, hash + store in otp_verifications, send via provider
    raise HTTPException(status_code=501, detail="OTP provider not wired up yet")


@router.post("/otp/verify", response_model=TokenResponse)
def verify_otp(payload: OTPVerifyRequest):
    # TODO: validate OTP, find-or-create candidate (generate candidate_code here),
    # issue JWT session
    raise HTTPException(status_code=501, detail="OTP verification not wired up yet")
