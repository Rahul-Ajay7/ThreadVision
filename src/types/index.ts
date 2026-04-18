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
  alertSeverity?: 'info' | 'warning' | 'critical';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'detection' | 'alert';
  message: string;
  detections: number;
  severity: 'info' | 'warning' | 'critical';
}

export interface AlertRecord {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  acknowledged: boolean;
  detection_id?: string;
  location?: string;
  description: string;
}

export interface PersonRecord {
  id: string;
  timestamp: string;
  confidence: number;
  bbox: [number, number, number, number];
  location?: string;
}

export interface BagRecord {
  id: string;
  timestamp: string;
  bag_type: string;
  confidence: number;
  bbox: [number, number, number, number];
  location?: string;
  status: string;
}

export interface SettingsData {
  detection_threshold: number;
  alert_on_person: boolean;
  alert_on_bag: boolean;
  alert_on_backpack: boolean;
  camera_sources: string[];
  notification_enabled: boolean;
  auto_acknowledge_minutes: number;
}
