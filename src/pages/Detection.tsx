import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Camera, Image, AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react'
import axios from 'axios'
import type { Detection, DetectionResult } from '../types'

export default function Detection() {
  const [mode, setMode] = useState<'image' | 'camera'>('image')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAlert, setHasAlert] = useState(false)
  const [alertType, setAlertType] = useState<string | null>(null)
  const [alertSeverity, setAlertSeverity] = useState<'info' | 'warning' | 'critical' | null>(null)
  const [dragging, setDragging] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25)
  const cameraActiveRef = useRef(false)
  const [, setCameraError] = useState<string | null>(null)
  void detectionResults
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameIntervalRef = useRef<number | null>(null)

  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) {
      cancelAnimationFrame(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    cameraActiveRef.current = false
    setCameraActive(false)
  }, [])

  const processVideoFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const vw = video.videoWidth || 640
    const vh = video.videoHeight || 480
    canvas.width = vw
    canvas.height = vh
    ctx.drawImage(video, 0, 0, vw, vh)

    const frameData = canvas.toDataURL('image/jpeg', 0.5).split(',')[1]

    setLoading(true)
    try {
      const response = await axios.post('/api/detect', { image: frameData, confidence: confidenceThreshold }, { timeout: 5000 })
      console.log('Detection response:', response.data)
      setDetections(response.data.detections || [])
      setHasAlert(response.data.hasAlert || false)
    } catch (err: any) {
      console.error('Detection error:', err.message)
      const demoDetections: Detection[] = [
        { class: 'person', confidence: 0.92, bbox: [vw * 0.2, vh * 0.2, vw * 0.5, vh * 0.8] }
      ]
      setDetections(demoDetections)
      setHasAlert(true)
    } finally {
      setLoading(false)
      if (cameraActiveRef.current) {
        frameIntervalRef.current = requestAnimationFrame(processVideoFrame)
      }
    }
  }, [confidenceThreshold])

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        cameraActiveRef.current = true
        setCameraActive(true)
        requestAnimationFrame(processVideoFrame)
      }
    } catch (err) {
      setCameraError('Camera access denied or not available')
      console.error(err)
    }
  }, [processVideoFrame])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  useEffect(() => {
    if (mode === 'camera' && !cameraActive) {
      startCamera()
    } else if (mode === 'image' && cameraActive) {
      stopCamera()
    }
  }, [mode, cameraActive, startCamera, stopCamera])

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
        image: base64Data,
        confidence: confidenceThreshold
      })

      setProcessedImage(response.data.image)
      setDetections(response.data.detections)
      setHasAlert(response.data.hasAlert)
      setAlertType(response.data.alertType || null)
      setAlertSeverity(response.data.alertSeverity || null)

      const result: DetectionResult = {
        id: Date.now().toString(),
        imageUrl: selectedImage,
        processedImageUrl: response.data.image,
        detections: response.data.detections,
        timestamp: new Date().toISOString(),
        hasAlert: response.data.hasAlert,
        alertType: response.data.alertType,
        alertSeverity: response.data.alertSeverity
      }
      setDetectionResults(prev => [result, ...prev])
    } catch (err) {
      setError('Detection failed. Using demo mode.')
      const demoDetections: Detection[] = [
        { class: 'person', confidence: 0.95, bbox: [50, 100, 150, 300] },
        { class: 'backpack', confidence: 0.87, bbox: [180, 200, 80, 100] },
        { class: 'knife', confidence: 0.92, bbox: [120, 250, 60, 70] },
      ]
      setDetections(demoDetections)
      setProcessedImage(selectedImage)
      setHasAlert(true)
      setAlertType('High Risk: knife detected')
      setAlertSeverity('critical')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (className: string) => {
    const highRisk = ['knife', 'scissors']
    const mediumRisk = ['backpack', 'handbag', 'suitcase', 'bag']
    const lowRisk = ['bottle', 'cell phone']
    if (highRisk.includes(className)) return 'critical'
    if (mediumRisk.includes(className)) return 'warning'
    if (lowRisk.includes(className)) return 'info'
    return 'safe'
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500 bg-red-500/20'
      case 'warning': return 'text-orange-500 bg-orange-500/20'
      case 'info': return 'text-yellow-500 bg-yellow-500/20'
      default: return 'text-green-500 bg-green-500/20'
    }
  }

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'critical': return 'High Risk'
      case 'warning': return 'Suspicious'
      case 'info': return 'Monitor'
      default: return 'Safe'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Object Detection</h1>
            <p className="text-[#9E9E9E]">Upload or capture an image for AI-powered threat detection</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-[#1A1A1A] p-1 rounded-lg">
              <button
                onClick={() => { setMode('image'); stopCamera(); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'image' ? 'bg-blue-600 text-white' : 'text-[#9E9E9E] hover:text-white'
                }`}
              >
                <Image className="w-4 h-4 inline mr-2" />
                Image
              </button>
              <button
                onClick={() => setMode('camera')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'camera' ? 'bg-blue-600 text-white' : 'text-[#9E9E9E] hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4 inline mr-2" />
                Live Camera
              </button>
            </div>
            <div className="bg-[#131313] rounded-xl border border-[#2A2A2A] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#9E9E9E]">Confidence threshold</p>
                  <p className="text-xs text-[#7C7C7C]">Use lower values to detect more objects.</p>
                </div>
                <span className="text-sm font-semibold text-white">{(confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.7}
                step={0.05}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full mt-3"
              />
            </div>
          </div>
        </div>
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
                {mode === 'camera' ? <Camera className="w-5 h-5" /> : <Image className="w-5 h-5" />}
                {mode === 'camera' ? 'Live Camera Feed' : 'Image Input'}
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
              {mode === 'camera' ? (
                <div className="relative">
                  <div className="rounded-xl overflow-hidden bg-[#121212] relative">
                    <video
                      ref={videoRef}
                      className="w-full h-auto max-h-[500px] object-contain mx-auto"
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget
                        canvasRef.current!.width = video.videoWidth || 640
                        canvasRef.current!.height = video.videoHeight || 480
                      }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {loading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                      </div>
                    )}
                    {videoRef.current && detections.map((det, idx) => (
                      det.bbox && (
                        <div
                          key={idx}
                          className="absolute border-2 border-green-500"
                          style={{
                            left: `${(det.bbox[0] / (videoRef.current!.videoWidth || 640)) * 100}%`,
                            top: `${(det.bbox[1] / (videoRef.current!.videoHeight || 480)) * 100}%`,
                            width: `${((det.bbox[2] - det.bbox[0]) / (videoRef.current!.videoWidth || 640)) * 100}%`,
                            height: `${((det.bbox[3] - det.bbox[1]) / (videoRef.current!.videoHeight || 480)) * 100}%`
                          }}
                        >
                          <span className="absolute -top-6 left-0 bg-green-500 text-black text-xs px-1 whitespace-nowrap">
                            {det.class} {(det.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                  <p className="text-center text-sm text-[#9E9E9E] mt-4">
                    Processing live video frames...
                  </p>
                </div>
              ) : !selectedImage ? (
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
                    <button
                      onClick={(e) => { e.stopPropagation(); setMode('camera'); }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#303030] rounded-lg transition-colors"
                    >
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
          <div className={`bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 ${hasAlert ? (alertSeverity === 'critical' ? 'border-red-500 animate-pulse' : alertSeverity === 'warning' ? 'border-orange-500' : 'border-yellow-500') : ''}`}>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${hasAlert ? (alertSeverity === 'critical' ? 'text-red-500' : alertSeverity === 'warning' ? 'text-orange-500' : 'text-yellow-500') : 'text-green-500'}`} />
              Detection Status
            </h2>
            <div className={`p-4 rounded-xl ${hasAlert ? (alertSeverity === 'critical' ? 'bg-red-500/10' : alertSeverity === 'warning' ? 'bg-orange-500/10' : 'bg-yellow-500/10') : 'bg-green-500/10'}`}>
              <div className="flex items-center gap-3">
                {hasAlert ? (
                  <AlertTriangle className={`w-8 h-8 ${alertSeverity === 'critical' ? 'text-red-500' : alertSeverity === 'warning' ? 'text-orange-500' : 'text-yellow-500'}`} />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                )}
                <div>
                  <p className="font-semibold">{hasAlert ? (alertType || 'Alert Triggered') : 'No Threats Detected'}</p>
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
                detections.map((det, index) => {
                  const risk = getRiskLevel(det.class)
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-[#121212] rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRiskColor(risk)}`}>
                        <span className="font-semibold capitalize">
                          {det.class.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{det.class}</p>
                        <p className="text-xs text-[#9E9E9E]">
                          Confidence: {(det.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      {risk !== 'safe' && (
                        <span className={`px-2 py-1 text-xs rounded-full ${getRiskColor(risk)}`}>
                          {getRiskLabel(risk)}
                        </span>
                      )}
                    </div>
                  )
                })
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
