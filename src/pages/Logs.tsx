import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle, Filter, Download, Search, Loader2 } from 'lucide-react'
import { LogEntry } from '../types'
import axios from 'axios'

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'detection' | 'alert'>('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await axios.get<LogEntry[]>('/api/logs')
      setLogs(response.data)
    } catch (error) {
      setLogs([
        { id: '1', timestamp: '2024-02-15 14:30:25', type: 'detection', message: 'Person detected with backpack', detections: 2, severity: 'info' },
        { id: '2', timestamp: '2024-02-15 14:28:10', type: 'alert', message: 'Unattended baggage detected', detections: 1, severity: 'critical' },
        { id: '3', timestamp: '2024-02-15 14:25:45', type: 'detection', message: 'Multiple persons detected', detections: 5, severity: 'info' },
        { id: '4', timestamp: '2024-02-15 14:22:30', type: 'alert', message: 'Suspicious object left unattended', detections: 1, severity: 'critical' },
        { id: '5', timestamp: '2024-02-15 14:20:15', type: 'detection', message: 'Handbag detected near entrance', detections: 1, severity: 'warning' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesType = filter === 'all' || log.type === filter
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSeverity && matchesSearch
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10'
      case 'warning': return 'text-yellow-500 bg-yellow-500/10'
      default: return 'text-blue-500 bg-blue-500/10'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'alert' ? AlertTriangle : CheckCircle
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Detection Logs</h1>
        <p className="text-[#9E9E9E]">Complete history of all detection events and alerts</p>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
        <div className="p-4 border-b border-[#2A2A2A]">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9E9E9E]" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-[#303030] rounded-lg text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#9E9E9E]" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="bg-[#121212] border border-[#303030] rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="detection">Detections</option>
                  <option value="alert">Alerts</option>
                </select>
              </div>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
                className="bg-[#121212] border border-[#303030] rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All Severity</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#303030] rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="mx-auto mb-3 animate-spin text-blue-500" />
              <p className="text-[#9E9E9E]">Loading logs...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#9E9E9E]">Timestamp</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#9E9E9E]">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#9E9E9E]">Message</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#9E9E9E]">Objects</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#9E9E9E]">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const TypeIcon = getTypeIcon(log.type)
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#9E9E9E]" />
                          <span className="text-sm font-mono">{log.timestamp}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-2 text-sm ${log.type === 'alert' ? 'text-red-500' : 'text-green-500'}`}>
                          <TypeIcon className="w-4 h-4" />
                          <span className="capitalize">{log.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{log.message}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-[#272727] rounded text-sm">{log.detections}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {!loading && filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-[#9E9E9E]">No logs found matching your criteria</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#2A2A2A] flex items-center justify-between">
          <p className="text-sm text-[#9E9E9E]">
            Showing {filteredLogs.length} of {logs.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-[#272727] rounded-lg text-sm hover:bg-[#303030] transition-colors" disabled>
              Previous
            </button>
            <button className="px-3 py-1 bg-[#272727] rounded-lg text-sm hover:bg-[#303030] transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
