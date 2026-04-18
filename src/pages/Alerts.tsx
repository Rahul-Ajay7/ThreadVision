import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Loader2, RefreshCcw } from 'lucide-react'
import axios from 'axios'
import type { AlertRecord } from '../types'

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<AlertRecord[]>('/api/alerts')
      setAlerts(response.data)
    } catch (err) {
      setError('Unable to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await axios.post(`/api/alerts/${alertId}/acknowledge`)
      setAlerts((current) => current.map((alert) => (
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )))
    } catch (err) {
      setError('Unable to acknowledge alert')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Alerts</h1>
        <p className="text-[#9E9E9E]">Review and acknowledge current system alerts</p>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-[#9E9E9E]">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-500/10 text-red-300">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#121212] text-center text-[#9E9E9E]">
            No alerts available at the moment.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h2 className="text-lg font-semibold">{alert.type}</h2>
                    </div>
                    <p className="text-sm text-[#9E9E9E] mb-2">{alert.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-[#9E9E9E]">
                      <span>{alert.location || 'Unknown location'}</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      <span className="capitalize">Severity: {alert.severity}</span>
                    </div>
                  </div>

                  <button
                    disabled={alert.acknowledged}
                    onClick={() => acknowledgeAlert(alert.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${alert.acknowledged ? 'bg-slate-700 text-slate-400' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                  >
                    {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 text-right">
            <button
              onClick={fetchAlerts}
              className="inline-flex items-center gap-2 rounded-xl bg-[#272727] px-4 py-2 text-sm hover:bg-[#303030] transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
