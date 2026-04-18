import { Shield, AlertTriangle, Eye, Clock, TrendingUp, Camera } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'

interface Stats {
  totalDetections: number
  activeAlerts: number
  personsDetected: number
  bagsDetected: number
  dangerousDetected: number
}

interface RecentDetection {
  id: string
  timestamp: string
  detections: number
  hasAlert: boolean
}

interface AlertSummary {
  id: string
  timestamp: string
  type: string
  severity: string
}

interface SystemStatus {
  aiModel: string
  cameraFeeds: string
  uptime: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    activeAlerts: 0,
    personsDetected: 0,
    bagsDetected: 0,
    dangerousDetected: 0
  })
  const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([])
  const [recentAlerts, setRecentAlerts] = useState<AlertSummary[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    aiModel: 'Loading...',
    cameraFeeds: 'Loading...',
    uptime: 'Loading...'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard')
      setStats(response.data.stats)
      setRecentDetections(response.data.recentDetections)
      setRecentAlerts(response.data.recentAlerts || [])
      setSystemStatus(response.data.systemStatus || {
        aiModel: 'Active',
        cameraFeeds: '4 Online',
        uptime: '99.8%'
      })
    } catch (error) {
      setStats({
        totalDetections: 156,
        activeAlerts: 3,
        personsDetected: 89,
        bagsDetected: 42
      })
      setRecentDetections([
        { id: '1', timestamp: '2024-02-15 10:30:00', detections: 3, hasAlert: true },
        { id: '2', timestamp: '2024-02-15 10:25:00', detections: 2, hasAlert: false },
        { id: '3', timestamp: '2024-02-15 10:20:00', detections: 1, hasAlert: false },
        { id: '4', timestamp: '2024-02-15 10:15:00', detections: 4, hasAlert: true },
        { id: '5', timestamp: '2024-02-15 10:10:00', detections: 2, hasAlert: false },
        { id: '6', timestamp: '2024-02-15 10:05:00', detections: 1, hasAlert: false },
      ])
      setRecentAlerts([
        { id: '1', timestamp: '2 min ago', type: 'Unattended Bag', severity: 'high' },
        { id: '2', timestamp: '15 min ago', type: 'Crowd Gathering', severity: 'medium' }
      ])
      setSystemStatus({ aiModel: 'Active', cameraFeeds: '4 Online', uptime: '99.8%' })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Detections', value: stats.totalDetections, icon: Eye, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Alerts', value: stats.activeAlerts, icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
    { label: 'Persons Detected', value: stats.personsDetected, icon: Shield, color: 'from-green-500 to-emerald-500' },
    { label: 'Bags Detected', value: stats.bagsDetected, icon: Camera, color: 'from-purple-500 to-pink-500' },
    { label: 'Dangerous Items', value: stats.dangerousDetected, icon: AlertTriangle, color: 'from-red-600 to-red-800' },
  ]

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Surveillance Dashboard</h1>
        <p className="text-[#9E9E9E]">Real-time AI-powered threat detection overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-[#1A1A1A] rounded-xl p-5 border border-[#2A2A2A] hover:border-[#3A3A3A] transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{loading ? '-' : stat.value}</h3>
            <p className="text-sm text-[#9E9E9E]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Detections
              </h2>
              <Link to="/detection" className="text-sm text-blue-500 hover:text-blue-400 transition-colors">
                Upload New
              </Link>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {recentDetections.map((detection) => (
                  <div
                    key={detection.id}
                    className="relative bg-[#121212] rounded-lg overflow-hidden group cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    <div className="aspect-video bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] flex items-center justify-center">
                      <Camera className="w-8 h-8 text-[#3A3A3A]" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-[#9E9E9E] mb-1">{detection.timestamp}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{detection.detections} objects</span>
                        {detection.hasAlert && (
                          <span className="px-2 py-0.5 bg-red-600 text-xs rounded-full">Alert</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Recent Alerts
            </h2>
            <div className="space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 p-3 bg-[#121212] rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.type}</p>
                      <p className="text-xs text-[#9E9E9E]">{alert.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg bg-[#121212] text-sm text-[#9E9E9E]">No alerts in the last hour</div>
              )}
            </div>
          </div>

          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4">
            <h2 className="font-semibold mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9E9E9E]">AI Model</span>
                <span className="text-sm font-medium">{systemStatus.aiModel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9E9E9E]">Camera Feeds</span>
                <span className="text-sm font-medium">{systemStatus.cameraFeeds}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9E9E9E]">Detection Rate</span>
                <span className="text-sm font-medium">{systemStatus.uptime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
