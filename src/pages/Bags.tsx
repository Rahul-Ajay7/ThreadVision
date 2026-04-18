import { useEffect, useState } from 'react'
import axios from 'axios'
import { FileVideo, Clock, ArrowRight, Loader2 } from 'lucide-react'
import type { BagRecord } from '../types'

interface BagResponse {
  total: number
  records: BagRecord[]
}

export default function Bags() {
  const [data, setData] = useState<BagResponse>({ total: 0, records: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBags()
  }, [])

  const fetchBags = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<BagResponse>('/api/bags')
      setData(response.data)
    } catch (err) {
      setError('Unable to load bag detections')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Bag Detection</h1>
        <p className="text-[#9E9E9E]">Track detected bags and monitor their status</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[#9E9E9E]">Tracked bags</p>
              <p className="text-4xl font-bold">{loading ? '...' : data.total}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-4 text-white">
              <FileVideo className="w-6 h-6" />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" />
              <p className="text-[#9E9E9E]">Loading bag detections...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-500/10 p-4 text-red-300">{error}</div>
          ) : (
            <div className="space-y-3">
              {data.records.map((bag) => (
                <div key={bag.id} className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{bag.bag_type}</p>
                      <p className="text-sm text-[#9E9E9E]">{new Date(bag.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="text-sm text-indigo-300">{bag.status}</span>
                  </div>
                  <div className="mt-3 text-xs text-[#9E9E9E]">
                    Confidence: {(bag.confidence * 100).toFixed(0)}% · bbox: [{bag.bbox.join(', ')}]
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-lg font-semibold mb-4">Bag Detection Summary</h2>
          <div className="space-y-3 text-sm text-[#9E9E9E]">
            <p className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-purple-400" /> Monitor backpack and bag detections</p>
            <p className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-purple-400" /> Track status changes for suspicious items</p>
            <p className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-purple-400" /> Export or integrate with alerts</p>
          </div>
        </div>
      </div>
    </div>
  )
}
