# ThreadVision - AI Surveillance System

Real-time AI-powered threat detection system with YouTube-inspired UI.

## Features

- Upload/capture images for AI detection
- YOLOv8-powered object detection (Person, Backpack, Handbag)
- Real-time bounding box visualization
- Alert system for suspicious objects
- Detection logs with timestamps
- YouTube-inspired dark UI layout

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI
- **AI**: YOLOv8 (Ultralytics) + OpenCV

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Endpoints

- `POST /api/detect` - Process image for object detection
- `GET /api/dashboard` - Get dashboard statistics
- `GET /health` - Health check
