from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.detection import router as detection_router
from routes.dashboard import router as dashboard_router
from routes.alerts import router as alerts_router
from routes.person import router as person_router
from routes.bags import router as bags_router
from routes.settings import router as settings_router
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ThreadVision API",
    description="AI-powered surveillance detection system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, prefix="/api")
app.include_router(detection_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(person_router, prefix="/api")
app.include_router(bags_router, prefix="/api")
app.include_router(settings_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ThreadVision API", "status": "running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "model_loaded": True,
        "endpoints": {
            "dashboard": "/api/dashboard",
            "detect": "/api/detect",
            "logs": "/api/logs",
            "alerts": "/api/alerts",
            "person": "/api/person",
            "bags": "/api/bags",
            "settings": "/api/settings"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
