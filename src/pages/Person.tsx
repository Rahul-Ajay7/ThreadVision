import { useEffect, useState } from 'react'
import axios from 'axios'
import { Users, Clock, ArrowRight, Loader2 } from 'lucide-react'
import type { PersonRecord } from '../types'

interface PersonResponse {
  total: number
  records: PersonRecord[]
}

export default function Person() {
  const [data, setData] = useState<PersonResponse>({ total: 0, records: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPeople()
  }, [])

  const fetchPeople = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get<PersonResponse>('/api/person')
      setData(response.data)
    } catch (err) {
      setError('Unable to load person detection records')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Person Detection</h1>
        <p className="text-[#9E9E9E]">View recent person detection events and confidence data</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-[#9E9E9E]">Detected people</p>
              <p className="text-4xl font-bold">{loading ? '...' : data.total}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-4 text-white">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" />
              <p className="text-[#9E9E9E]">Loading records...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-500/10 p-4 text-red-300">{error}</div>
          ) : (
            <div className="space-y-3">
              {data.records.map((person) => (
                <div key={person.id} className="rounded-xl border border-[#2A2A2A] bg-[#121212] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{person.location ?? 'Unknown location'}</p>
                      <p className="text-sm text-[#9E9E9E]">{new Date(person.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="text-sm text-blue-300">{(person.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-3 text-xs text-[#9E9E9E]">
                    Bounding box: [{person.bbox.join(', ')}]
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
          <h2 className="text-lg font-semibold mb-4">Person Detection Summary</h2>
          <div className="space-y-3 text-sm text-[#9E9E9E]">
            <p className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-500" /> Real-time person monitoring history</p>
            <p className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-500" /> Confidence level and bounding box tracking</p>
            <p className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-blue-500" /> Store or export records later</p>
          </div>
        </div>
      </div>
    </div>
  )
}
