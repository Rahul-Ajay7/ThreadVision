from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class Settings(BaseModel):
    detection_threshold: float = 0.5
    alert_on_person: bool = False
    alert_on_bag: bool = True
    alert_on_backpack: bool = True
    camera_sources: list = ["CCTV-1", "CCTV-2", "CCTV-3", "CCTV-4"]
    notification_enabled: bool = True
    auto_acknowledge_minutes: int = 30

settings = Settings()

@router.get("/settings")
async def get_settings():
    return settings

@router.put("/settings")
async def update_settings(new_settings: Settings):
    global settings
    settings = new_settings
    return settings

@router.get("/settings/model")
async def get_model_info():
    return {
        "model_name": "YOLOv8n",
        "classes": ["person", "backpack", "handbag", "suitcase", "bag"],
        "input_size": 640,
        "confidence_threshold": 0.5,
        "iou_threshold": 0.45
    }
