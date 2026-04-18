import base64
import io
import cv2
import numpy as np
import torch
from PIL import Image
from ultralytics import YOLO
import ultralytics.nn.tasks as ultralytics_tasks
import logging

logger = logging.getLogger(__name__)

MODEL_NAME = 'yolov8m.pt'
DEFAULT_CONFIDENCE = 0.25

MODEL_CLASSES = ['person', 'backpack', 'handbag', 'suitcase', 'bag', 'knife', 'scissors', 'bottle', 'cell phone']
ALERT_CLASSES = ['backpack', 'handbag', 'suitcase', 'bag', 'knife', 'scissors', 'bottle', 'cell phone']

HIGH_RISK_CLASSES = ['knife', 'scissors']
MEDIUM_RISK_CLASSES = ['backpack', 'handbag', 'suitcase', 'bag']
LOW_RISK_CLASSES = ['bottle', 'cell phone']

class DetectionEngine:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def load_model(self):
        if self._model is None:
            safe_globals = [
                ultralytics_tasks.DetectionModel,
                torch.nn.modules.container.Sequential,
                torch.nn.modules.module.Module,
            ]
            try:
                if hasattr(torch.serialization, 'safe_globals'):
                    with torch.serialization.safe_globals(safe_globals):
                        self._model = YOLO(MODEL_NAME)
                elif hasattr(torch.serialization, 'add_safe_globals'):
                    torch.serialization.add_safe_globals(safe_globals)
                    self._model = YOLO(MODEL_NAME)
                else:
                    self._model = YOLO(MODEL_NAME)
                logger.info("YOLO model loaded successfully: %s", MODEL_NAME)
            except Exception as e:
                logger.warning(f"Safe globals load failed: {e}")
                try:
                    logger.info("Retrying YOLO load with weights_only=False fallback")
                    original_load = torch.load
                    def patched_load(*args, **kwargs):
                        kwargs.setdefault('weights_only', False)
                        return original_load(*args, **kwargs)
                    torch.load = patched_load
                    self._model = YOLO(MODEL_NAME)
                    logger.info("YOLO model loaded successfully with weights_only=False fallback: %s", MODEL_NAME)
                except Exception as fallback_e:
                    logger.warning(f"YOLO load fallback failed: {fallback_e}")
                    self._model = None
                finally:
                    torch.load = original_load
        return self._model

    def process_image(self, image_data: str, confidence: float = DEFAULT_CONFIDENCE) -> dict:
        try:
            image_bytes = base64.b64decode(image_data)
            pil_image = Image.open(io.BytesIO(image_bytes))
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            detections = []
            processed_image_base64 = None
            
            model = self.load_model()
            
            if model is not None:
                results = model(cv_image, conf=confidence, verbose=False)
                
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
                            if cls_name == 'person':
                                color = (0, 255, 0)  # Green
                            elif cls_name in HIGH_RISK_CLASSES:
                                color = (0, 0, 255)  # Red
                            elif cls_name in MEDIUM_RISK_CLASSES:
                                color = (0, 165, 255)  # Orange
                            else:
                                color = (0, 255, 255)  # Yellow
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
            alert_severity = 'info'
            if has_alert:
                high_risk = [d['class'] for d in detections if d['class'] in HIGH_RISK_CLASSES]
                medium_risk = [d['class'] for d in detections if d['class'] in MEDIUM_RISK_CLASSES]
                low_risk = [d['class'] for d in detections if d['class'] in LOW_RISK_CLASSES]
                
                if high_risk:
                    alert_type = f"High Risk: {', '.join(set(high_risk))} detected"
                    alert_severity = 'critical'
                elif medium_risk:
                    alert_type = f"Suspicious: {', '.join(set(medium_risk))} detected"
                    alert_severity = 'warning'
                elif low_risk:
                    alert_type = f"Potential concern: {', '.join(set(low_risk))} detected"
                    alert_severity = 'info'

            return {
                'success': True,
                'detections': detections,
                'image': processed_image_base64,
                'hasAlert': has_alert,
                'alertType': alert_type,
                'alertSeverity': alert_severity,
                'stats': {
                    'total': len(detections),
                    'persons': sum(1 for d in detections if d['class'] == 'person'),
                    'bags': sum(1 for d in detections if d['class'] in MEDIUM_RISK_CLASSES),
                    'dangerous': sum(1 for d in detections if d['class'] in HIGH_RISK_CLASSES + LOW_RISK_CLASSES)
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
