import base64
import io
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO
import logging

logger = logging.getLogger(__name__)

MODEL_CLASSES = ['person', 'backpack', 'handbag', 'suitcase', 'bag']
ALERT_CLASSES = ['backpack', 'handbag', 'suitcase', 'bag']

class DetectionEngine:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        if self._model is None:
            try:
                self._model = YOLO('yolov8n.pt')
                logger.info("YOLOv8 model loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load YOLOv8 model: {e}")
                self._model = None
        return self._model

    def process_image(self, image_data: str) -> dict:
        try:
            image_bytes = base64.b64decode(image_data)
            pil_image = Image.open(io.BytesIO(image_bytes))
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            detections = []
            processed_image_base64 = None
            
            model = self.load_model()
            
            if model is not None:
                results = model(cv_image, verbose=False)
                
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0])
                        cls_name = result.names[cls_id].lower()
                        
                        if cls_name in MODEL_CLASSES:
                            conf = float(box.conf[0])
                            bbox = box.xyxy[0].cpu().numpy().tolist()
                            
                            detections.append({
                                'class': cls_name,
                                'confidence': round(conf, 4),
                                'bbox': [round(x, 2) for x in bbox]
                            })
                            
                            x1, y1, x2, y2 = map(int, bbox)
                            color = (0, 255, 0) if cls_name == 'person' else (0, 165, 255)
                            cv2.rectangle(cv_image, (x1, y1), (x2, y2), color, 2)
                            
                            label = f"{cls_name} {conf:.2f}"
                            cv2.putText(cv_image, label, (x1, y1 - 10),
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                processed_rgb = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
                processed_pil = Image.fromarray(processed_rgb)
                buffer = io.BytesIO()
                processed_pil.save(buffer, format="JPEG", quality=85)
                processed_image_base64 = base64.b64encode(buffer.getvalue()).decode()
            else:
                processed_image_base64 = image_data

            has_alert = any(d['class'] in ALERT_CLASSES for d in detections)
            alert_type = None
            if has_alert:
                alert_objects = [d['class'] for d in detections if d['class'] in ALERT_CLASSES]
                alert_type = f"Unattended {', '.join(set(alert_objects))} detected"

            return {
                'success': True,
                'detections': detections,
                'image': processed_image_base64,
                'hasAlert': has_alert,
                'alertType': alert_type,
                'stats': {
                    'total': len(detections),
                    'persons': sum(1 for d in detections if d['class'] == 'person'),
                    'bags': sum(1 for d in detections if d['class'] in ALERT_CLASSES)
                }
            }

        except Exception as e:
            logger.error(f"Detection error: {e}")
            return {
                'success': False,
                'error': str(e),
                'detections': [],
                'image': image_data,
                'hasAlert': False,
                'alertType': None
            }

detection_engine = DetectionEngine()
