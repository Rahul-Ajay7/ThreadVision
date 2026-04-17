export interface Detection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface DetectionResult {
  id: string;
  imageUrl: string;
  processedImageUrl: string;
  detections: Detection[];
  timestamp: string;
  hasAlert: boolean;
  alertType?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'detection' | 'alert';
  message: string;
  detections: number;
  severity: 'info' | 'warning' | 'critical';
}
