from fastapi import APIRouter
from pydantic import BaseModel
from utils.detector import detection_engine

router = APIRouter()

class DetectionRequest(BaseModel):
    image: str

class DashboardResponse(BaseModel):
    stats: dict
    recentDetections: list

@router.post("/detect")
async def detect_objects(request: DetectionRequest):
    result = detection_engine.process_image(request.image)
    return result

@router.get("/health")
async def health_check():
    return {"status": "ok", "model": "yolov8n"}
