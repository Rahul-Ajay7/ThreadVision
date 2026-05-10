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
WEAPONS_MODEL = 'yolov8n.pt'
DEFAULT_CONFIDENCE = 0.25

MODEL_CLASSES = ['person', 'backpack', 'handbag', 'suitcase', 'bag', 'knife', 'scissors', 'bottle', 'cell phone', 'gun', 'pistol', 'rifle', 'bomb', 'explosive', 'weapon']
ALERT_CLASSES = ['backpack', 'handbag', 'suitcase', 'bag', 'knife', 'scissors', 'bottle', 'cell phone', 'gun', 'pistol', 'rifle', 'bomb', 'explosive', 'weapon']

HIGH_RISK_CLASSES = ['knife', 'scissors', 'gun', 'pistol', 'rifle', 'bomb', 'explosive', 'weapon']
MEDIUM_RISK_CLASSES = ['backpack', 'handbag', 'suitcase', 'bag']
LOW_RISK_CLASSES = ['bottle', 'cell phone']

class DetectionEngine:
    _instance = None
    _model = None
    _weapons_model = None

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

    def load_weapons_model(self):
        if self._weapons_model is None:
            try:
                self._weapons_model = YOLO(WEAPONS_MODEL)
                logger.info("Weapons YOLO model loaded successfully: %s", WEAPONS_MODEL)
            except Exception as e:
                logger.warning(f"Weapons model load failed: {e}")
                self._weapons_model = None
        return self._weapons_model

    def process_image(self, image_data: str, confidence: float = DEFAULT_CONFIDENCE) -> dict:
        try:
            image_bytes = base64.b64decode(image_data)
            pil_image = Image.open(io.BytesIO(image_bytes))
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
            detections = []
            processed_image_base64 = None
            
            model = self.load_model()
            weapons_model = self.load_weapons_model()
            
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
                
            if weapons_model is not None:
                results = weapons_model(cv_image, conf=confidence, verbose=False)
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0])
                        cls_name = result.names[cls_id].lower()
                        
                        if cls_name in ['knife', 'scissors', 'gun', 'pistol', 'rifle', 'bomb', 'explosive', 'weapon']:
                            conf = float(box.conf[0])
                            bbox = box.xyxy[0].cpu().numpy().tolist()
                            
                            detections.append({
                                'class': cls_name,
                                'confidence': round(conf, 4),
                                'bbox': [round(x, 2) for x in bbox]
                            })
                            
                            x1, y1, x2, y2 = map(int, bbox)
                            color = (0, 0, 255)  # Red for weapons
                            cv2.rectangle(cv_image, (x1, y1), (x2, y2), color, 2)
                            
                            label = f"{cls_name} {conf:.2f}"
                            cv2.putText(cv_image, label, (x1, y1 - 10),
                                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            processed_rgb = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
            processed_pil = Image.fromarray(processed_rgb)
            buffer = io.BytesIO()
            processed_pil.save(buffer, format="JPEG", quality=85)
            processed_image_base64 = base64.b64encode(buffer.getvalue()).decode()

                # Detect unattended bags
            bags = [d for d in detections if d['class'] in MEDIUM_RISK_CLASSES]
            persons = [d for d in detections if d['class'] == 'person']
            unattended_bags = []
            for bag in bags:
                bag_bbox = bag['bbox']
                bag_center_x = (bag_bbox[0] + bag_bbox[2]) / 2
                bag_center_y = (bag_bbox[1] + bag_bbox[3]) / 2
                unattended = True
                for person in persons:
                    person_bbox = person['bbox']
                    person_center_x = (person_bbox[0] + person_bbox[2]) / 2
                    person_center_y = (person_bbox[1] + person_bbox[3]) / 2
                    distance = ((bag_center_x - person_center_x)**2 + (bag_center_y - person_center_y)**2)**0.5
                    if distance < 150:
                        unattended = False
                        break
                if unattended:
                    unattended_bags.append(bag)
            
            # Detect panic situation
            num_persons = len(persons)
            has_panic = False
            density = 0
            if num_persons > 10:
                total_area = sum((p['bbox'][2] - p['bbox'][0]) * (p['bbox'][3] - p['bbox'][1]) for p in persons)
                image_area = cv_image.shape[0] * cv_image.shape[1]
                density = total_area / image_area if image_area > 0 else 0
                if density > 0.3 or num_persons > 25:
                    has_panic = True
            
            has_alert = any(d['class'] in ALERT_CLASSES for d in detections) or len(unattended_bags) > 0 or has_panic
            alert_type = None
            alert_severity = 'info'
            if has_panic:
                alert_type = "Potential Panic Situation: High crowd density detected"
                alert_severity = 'critical'
            elif len(unattended_bags) > 0:
                alert_type = f"Unattended bags detected: {len(unattended_bags)}"
                alert_severity = 'high'
            elif has_alert:
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
                'unattendedBags': len(unattended_bags),
                'hasPanic': has_panic,
                'density': density,
                'stats': {
                    'total': len(detections),
                    'persons': sum(1 for d in detections if d['class'] == 'person'),
                    'bags': sum(1 for d in detections if d['class'] in MEDIUM_RISK_CLASSES),
                    'dangerous': sum(1 for d in detections if d['class'] in HIGH_RISK_CLASSES + LOW_RISK_CLASSES),
                    'unattendedBags': len(unattended_bags)
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

    def process_video(self, video_data: bytes, confidence: float = DEFAULT_CONFIDENCE, frame_skip: int = 30) -> dict:
        try:
            import os
            import tempfile

            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp:
                tmp.write(video_data)
                tmp_path = tmp.name

            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                os.unlink(tmp_path)
                return {'success': False, 'error': 'Could not open video file'}

            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = round(total_frames / fps, 2) if fps > 0 else 0

            all_detections = []
            key_frames = []
            frame_count = 0

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % frame_skip == 0:
                    _, buffer = cv2.imencode('.jpg', frame)
                    frame_b64 = base64.b64encode(buffer).decode()

                    result = self.process_image(frame_b64, confidence)

                    if result.get('success'):
                        frame_detections = result.get('detections', [])
                        all_detections.extend(frame_detections)

                        if result.get('hasAlert') and len(key_frames) < 10:
                            timestamp = round(frame_count / fps, 2) if fps > 0 else frame_count
                            key_frames.append({
                                'frame': frame_count,
                                'timestamp': timestamp,
                                'image': result.get('image'),
                                'detections': frame_detections,
                                'alertType': result.get('alertType'),
                                'alertSeverity': result.get('alertSeverity'),
                                'hasAlert': result.get('hasAlert')
                            })

                frame_count += 1

            cap.release()
            os.unlink(tmp_path)

            # Deduplicate: keep highest confidence per class
            best = {}
            for d in all_detections:
                cls = d['class']
                if cls not in best or d['confidence'] > best[cls]['confidence']:
                    best[cls] = d
            unique_detections = list(best.values())

            high_risk_found = [d['class'] for d in unique_detections if d['class'] in HIGH_RISK_CLASSES]
            medium_risk_found = [d['class'] for d in unique_detections if d['class'] in MEDIUM_RISK_CLASSES]
            low_risk_found = [d['class'] for d in unique_detections if d['class'] in LOW_RISK_CLASSES]

            has_alert = bool(high_risk_found or medium_risk_found or low_risk_found)
            alert_type = None
            alert_severity = 'info'

            if high_risk_found:
                alert_type = f"High Risk: {', '.join(set(high_risk_found))} detected in video"
                alert_severity = 'critical'
            elif medium_risk_found:
                alert_type = f"Suspicious: {', '.join(set(medium_risk_found))} detected in video"
                alert_severity = 'warning'
            elif low_risk_found:
                alert_type = f"Potential concern: {', '.join(set(low_risk_found))} detected in video"
                alert_severity = 'info'

            return {
                'success': True,
                'detections': unique_detections,
                'totalDetections': len(all_detections),
                'totalFrames': total_frames,
                'framesProcessed': frame_count // frame_skip + (1 if frame_count % frame_skip > 0 else 0),
                'fps': round(fps, 2) if fps > 0 else 0,
                'duration': duration,
                'hasAlert': has_alert,
                'alertType': alert_type,
                'alertSeverity': alert_severity,
                'keyFrames': key_frames,
                'stats': {
                    'total': len(unique_detections),
                    'persons': sum(1 for d in unique_detections if d['class'] == 'person'),
                    'bags': sum(1 for d in unique_detections if d['class'] in MEDIUM_RISK_CLASSES),
                    'dangerous': sum(1 for d in unique_detections if d['class'] in HIGH_RISK_CLASSES)
                }
            }

        except Exception as e:
            logger.error(f"Video processing error: {e}")
            return {'success': False, 'error': str(e)}

detection_engine = DetectionEngine()
