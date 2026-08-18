from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime
from app.database import get_session
from app.models.alert import Alert
from typing import List

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
def list_alerts(severity: str | None = None, resolved: bool = False, session: Session = Depends(get_session)):
    query = select(Alert)

    if not resolved:
        query = query.where(Alert.resolved_at == None)

    if severity:
        query = query.where(Alert.severity == severity)

    query = query.order_by(Alert.created_at.desc())
    alerts = session.exec(query).all()
    return alerts


@router.get("/{alert_id}")
def get_alert(alert_id: int, session: Session = Depends(get_session)):
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    return alert


@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: int, session: Session = Depends(get_session)):
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    alert.resolved_at = datetime.utcnow()
    session.add(alert)
    session.commit()
    session.refresh(alert)
    return alert
