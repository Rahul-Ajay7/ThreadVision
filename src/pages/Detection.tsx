import { useState, useRef } from 'react'
import { Upload, Camera, Image, AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react'
import axios from 'axios'
import type { Detection, DetectionResult } from '../types'

export default function Detection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAlert, setHasAlert] = useState(false)
  void detectionResults
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setProcessedImage(null)
        setDetections([])
        setError(null)
        setHasAlert(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const processImage = async () => {
    if (!selectedImage) return

    setLoading(true)
    setError(null)

    try {
      const base64Data = selectedImage.split(',')[1]
      const response = await axios.post('/api/detect', {
        image: base64Data
      })

      setProcessedImage(response.data.image)
      setDetections(response.data.detections)
      setHasAlert(response.data.hasAlert)

      const result: DetectionResult = {
        id: Date.now().toString(),
        imageUrl: selectedImage,
        processedImageUrl: response.data.image,
        detections: response.data.detections,
        timestamp: new Date().toISOString(),
        hasAlert: response.data.hasAlert,
        alertType: response.data.alertType
      }
      setDetectionResults(prev => [result, ...prev])
    } catch (err) {
      setError('Detection failed. Using demo mode.')
      const demoDetections: Detection[] = [
        { class: 'person', confidence: 0.95, bbox: [50, 100, 150, 300] },
        { class: 'backpack', confidence: 0.87, bbox: [180, 200, 80, 100] },
        { class: 'handbag', confidence: 0.72, bbox: [120, 250, 60, 70] },
      ]
      setDetections(demoDetections)
      setProcessedImage(selectedImage)
      setHasAlert(true)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setSelectedImage(null)
    setProcessedImage(null)
    setDetections([])
    setError(null)
    setHasAlert(false)
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Object Detection</h1>
        <p className="text-[#9E9E9E]">Upload or capture an image for AI-powered threat detection</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <p className="text-sm text-yellow-500">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Image className="w-5 h-5" />
                Image Input
              </h2>
              {selectedImage && (
                <button
                  onClick={clearResults}
                  className="text-sm text-red-500 hover:text-red-400 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            <div className="p-6">
              {!selectedImage ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    dragging
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#3A3A3A] hover:border-[#5A5A5A]'
                  }`}
                  onClick={handleUploadClick}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#272727] rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-[#9E9E9E]" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Drop your image here or click to upload</h3>
                  <p className="text-sm text-[#9E9E9E] mb-4">Supports JPG, PNG, WEBP</p>
                  <div className="flex items-center justify-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#303030] rounded-lg transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload File
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#303030] rounded-lg transition-colors">
                      <Camera className="w-4 h-4" />
                      Capture
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="rounded-xl overflow-hidden bg-[#121212]">
                    <img
                      src={processedImage || selectedImage}
                      alt="Processed"
                      className="w-full h-auto max-h-[500px] object-contain mx-auto"
                    />
                  </div>
                  {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
              )}

              {selectedImage && !loading && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={processImage}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Run Detection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 ${hasAlert ? 'border-red-500 animate-pulse' : ''}`}>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${hasAlert ? 'text-red-500' : 'text-green-500'}`} />
              Detection Status
            </h2>
            <div className={`p-4 rounded-xl ${hasAlert ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
              <div className="flex items-center gap-3">
                {hasAlert ? (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                )}
                <div>
                  <p className="font-semibold">{hasAlert ? 'Alert Triggered' : 'No Threats Detected'}</p>
                  <p className="text-sm text-[#9E9E9E]">
                    {hasAlert ? 'Review detected objects' : 'Scene appears safe'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4">
            <h2 className="font-semibold mb-4">Detected Objects ({detections.length})</h2>
            <div className="space-y-3">
              {detections.length === 0 ? (
                <p className="text-sm text-[#9E9E9E] text-center py-4">No objects detected yet</p>
              ) : (
                detections.map((det, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-[#121212] rounded-lg"
                  >
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-blue-500 font-semibold capitalize">
                        {det.class.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{det.class}</p>
                      <p className="text-xs text-[#9E9E9E]">
                        Confidence: {(det.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    {['backpack', 'handbag'].includes(det.class) && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
                        Monitor
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4">
            <h2 className="font-semibold mb-4">Detection Legend</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Person - Safe</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span>Backpack - Monitor</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span>Handbag - Monitor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
