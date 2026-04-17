from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import uuid

router = APIRouter()

class PersonRecord(BaseModel):
    id: str
    timestamp: str
    confidence: float
    bbox: List[float]
    location: Optional[str]

person_records: List[PersonRecord] = []

@router.get("/person")
async def get_person_detections(limit: int = 50, offset: int = 0):
    return {
        "total": len(person_records),
        "records": person_records[offset:offset + limit]
    }

@router.post("/person")
async def save_person_detection(record: PersonRecord):
    record.id = str(uuid.uuid4())
    record.timestamp = datetime.now().isoformat()
    person_records.insert(0, record)
    return record

@router.get("/person/stats")
async def get_person_stats():
    return {
        "total_persons": len(person_records),
        "avg_confidence": sum(p.confidence for p in person_records) / len(person_records) if person_records else 0,
        "locations": list(set(p.location for p in person_records if p.location))
    }
