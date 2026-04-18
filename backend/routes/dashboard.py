from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import uuid

router = APIRouter()

class LogEntry(BaseModel):
    id: str = ""
    timestamp: str = ""
    type: str = "detection"
    message: str = ""
    detections: int = 0
    severity: str = "info"
    objects: List[dict] = []

class StatsResponse(BaseModel):
    totalDetections: int
    activeAlerts: int
    personsDetected: int
    bagsDetected: int
    dangerousDetected: int
    detectionRate: float

class DetectionRecord(BaseModel):
    id: str
    imageUrl: str
    processedImageUrl: Optional[str]
    timestamp: str
    detections: List[dict]
    hasAlert: bool
    alertType: Optional[str]
    stats: Optional[dict] = None

db_logs: List[LogEntry] = []
db_detections: List[DetectionRecord] = []
stats = StatsResponse(
    totalDetections=0,
    activeAlerts=0,
    personsDetected=0,
    bagsDetected=42,
    dangerousDetected=0,
    detectionRate=99.2
)

def update_stats():
    stats.totalDetections = len(db_detections)
    stats.activeAlerts = sum(1 for d in db_detections if d.hasAlert)
    stats.personsDetected = sum(1 for det in db_detections for obj in det.detections if obj.get('class') == 'person')
    stats.bagsDetected = sum(1 for det in db_detections for obj in det.detections if obj.get('class') in ['backpack', 'handbag', 'bag', 'suitcase'])
    stats.dangerousDetected = sum(1 for det in db_detections for obj in det.detections if obj.get('class') in ['knife', 'scissors', 'bottle', 'cell phone'])

@router.get("/dashboard")
async def get_dashboard():
    update_stats()
    return {
        "stats": stats.model_dump(),
        "recentDetections": [
            {
                "id": d.id,
                "timestamp": d.timestamp,
                "detections": len(d.detections),
                "hasAlert": d.hasAlert,
                "alertType": d.alertType
            }
            for d in db_detections[-12:]
        ],
        "recentAlerts": [
            {
                "id": d.id,
                "timestamp": d.timestamp,
                "type": d.alertType or "Unknown",
                "severity": "high" if d.hasAlert else "info"
            }
            for d in db_detections[-5:] if d.hasAlert
        ],
        "systemStatus": {
            "aiModel": "Active",
            "cameraFeeds": "4 Online",
            "uptime": "99.8%"
        },
        "timestamp": datetime.now().isoformat()
    }

@router.get("/stats")
async def get_stats():
    update_stats()
    return stats.model_dump()

@router.get("/logs", response_model=List[LogEntry])
async def get_logs(
    type: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    results = db_logs.copy()
    
    if type:
        results = [l for l in results if l.type == type]
    if severity:
        results = [l for l in results if l.severity == severity]
    if search:
        results = [l for l in results if search.lower() in l.message.lower()]
    
    return results[offset:offset + limit]

@router.post("/logs")
async def create_log(entry: LogEntry):
    entry.id = str(uuid.uuid4())
    entry.timestamp = datetime.now().isoformat()
    db_logs.append(entry)
    return entry

@router.get("/logs/{log_id}")
async def get_log(log_id: str):
    for log in db_logs:
        if log.id == log_id:
            return log
    raise HTTPException(status_code=404, detail="Log not found")

@router.delete("/logs/{log_id}")
async def delete_log(log_id: str):
    global db_logs
    db_logs = [l for l in db_logs if l.id != log_id]
    return {"status": "deleted"}

@router.post("/detections")
async def save_detection(detection: DetectionRecord):
    detection.id = str(uuid.uuid4())
    detection.timestamp = datetime.now().isoformat()
    db_detections.append(detection)
    update_stats()
    
    if detection.hasAlert:
        log = LogEntry(
            id=str(uuid.uuid4()),
            timestamp=detection.timestamp,
            type="alert",
            message=detection.alertType or "Alert triggered",
            detections=len(detection.detections),
            severity="critical",
            objects=detection.detections
        )
        db_logs.insert(0, log)
    
    return detection

@router.get("/detections", response_model=List[DetectionRecord])
async def get_detections(limit: int = 20, offset: int = 0):
    return db_detections[offset:offset + limit]

@router.get("/detections/{detection_id}")
async def get_detection(detection_id: str):
    for det in db_detections:
        if det.id == detection_id:
            return det
    raise HTTPException(status_code=404, detail="Detection not found")

@router.delete("/detections/{detection_id}")
async def delete_detection(detection_id: str):
    global db_detections
    db_detections = [d for d in db_detections if d.id != detection_id]
    update_stats()
    return {"status": "deleted"}
