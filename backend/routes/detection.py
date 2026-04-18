from fastapi import APIRouter
from pydantic import BaseModel
from utils.detector import detection_engine

router = APIRouter()

class DetectionRequest(BaseModel):
    image: str
    confidence: float = 0.25

class DashboardResponse(BaseModel):
    stats: dict
    recentDetections: list

@router.post("/detect")
async def detect_objects(request: DetectionRequest):
    result = detection_engine.process_image(request.image, request.confidence)
    return result

@router.get("/health")
async def health_check():
    return {"status": "ok", "model": "yolov8n"}
