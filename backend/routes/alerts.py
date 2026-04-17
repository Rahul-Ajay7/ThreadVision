from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import uuid

router = APIRouter()

class Alert(BaseModel):
    id: str
    timestamp: str
    type: str
    severity: str
    acknowledged: bool
    detection_id: Optional[str]
    location: Optional[str]
    description: str

alerts_db: List[Alert] = [
    Alert(id="1", timestamp=datetime.now().isoformat(), type="Unattended Bag", severity="high", 
          acknowledged=False, detection_id=None, location="Entrance A", description="Baggage left unattended for 5+ minutes"),
    Alert(id="2", timestamp=datetime.now().isoformat(), type="Crowd Gathering", severity="medium",
          acknowledged=False, detection_id=None, location="Platform 3", description="More than 15 people detected"),
]

@router.get("/alerts")
async def get_alerts(acknowledged: Optional[bool] = None, severity: Optional[str] = None):
    results = alerts_db.copy()
    if acknowledged is not None:
        results = [a for a in results if a.acknowledged == acknowledged]
    if severity:
        results = [a for a in results if a.severity == severity]
    return results

@router.get("/alerts/count")
async def get_alert_count():
    unacknowledged = sum(1 for a in alerts_db if not a.acknowledged)
    return {"total": len(alerts_db), "unacknowledged": unacknowledged}

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    for alert in alerts_db:
        if alert.id == alert_id:
            alert.acknowledged = True
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")

@router.post("/alerts")
async def create_alert(alert: Alert):
    alert.id = str(uuid.uuid4())
    alert.timestamp = datetime.now().isoformat()
    alerts_db.insert(0, alert)
    return alert
