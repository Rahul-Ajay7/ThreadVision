from fastapi import APIRouter, File, UploadFile, Form
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

@router.post("/detect/video")
async def detect_video(
    file: UploadFile = File(...),
    confidence: float = Form(0.25),
    frame_skip: int = Form(30)
):
    video_bytes = await file.read()
    result = detection_engine.process_video(video_bytes, confidence, frame_skip)
    result['fileName'] = file.filename
    return result

@router.get("/health")
async def health_check():
    return {"status": "ok", "model": "yolov8n"}
