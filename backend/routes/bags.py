from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import uuid

router = APIRouter()

class BagRecord(BaseModel):
    id: str
    timestamp: str
    bag_type: str
    confidence: float
    bbox: List[float]
    location: Optional[str]
    status: str = "monitoring"

bag_records: List[BagRecord] = []

@router.get("/bags")
async def get_bag_detections(limit: int = 50, offset: int = 0):
    return {
        "total": len(bag_records),
        "records": bag_records[offset:offset + limit]
    }

@router.post("/bags")
async def save_bag_detection(record: BagRecord):
    record.id = str(uuid.uuid4())
    record.timestamp = datetime.now().isoformat()
    bag_records.insert(0, record)
    return record

@router.get("/bags/stats")
async def get_bag_stats():
    bag_types = {}
    for bag in bag_records:
        bag_types[bag.bag_type] = bag_types.get(bag.bag_type, 0) + 1
    
    return {
        "total_bags": len(bag_records),
        "by_type": bag_types,
        "monitoring": sum(1 for b in bag_records if b.status == "monitoring"),
        "cleared": sum(1 for b in bag_records if b.status == "cleared")
    }

@router.put("/bags/{bag_id}/status")
async def update_bag_status(bag_id: str, status: str):
    for bag in bag_records:
        if bag.id == bag_id:
            bag.status = status
            return bag
    raise HTTPException(status_code=404, detail="Bag record not found")
