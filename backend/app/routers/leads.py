"""
Leads router — junior-developer-owned CRUD once schemas are agreed.
Backs the landing page's Free Assessment / Trial registration capture forms.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.enums import ChannelType, LeadStatus
from app.models.marketing import Lead

router = APIRouter(prefix="/leads", tags=["leads"])


class LeadCreate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    landing_page_url: str | None = None
    campaign_id: uuid.UUID | None = None


class LeadRead(BaseModel):
    id: uuid.UUID
    name: str | None
    phone: str | None
    email: str | None
    status: LeadStatus
    created_at: datetime


@router.post("", response_model=LeadRead, status_code=201)
def create_lead(payload: LeadCreate, session: Session = Depends(get_session)):
    lead = Lead(**payload.model_dump())
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(lead_id: uuid.UUID, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.get("", response_model=list[LeadRead])
def list_leads(session: Session = Depends(get_session)):
    return session.exec(select(Lead).order_by(Lead.created_at.desc())).all()
