import { useEffect, useState, FormEvent } from 'react'
import axios from 'axios'
import { SettingsData } from '../types'
import { CheckCircle, Loader2 } from 'lucide-react'

const defaultSettings: SettingsData = {
  detection_threshold: 0.5,
  alert_on_person: false,
  alert_on_bag: true,
  alert_on_backpack: true,
  camera_sources: ['CCTV-1', 'CCTV-2', 'CCTV-3', 'CCTV-4'],
  notification_enabled: true,
  auto_acknowledge_minutes: 30
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await axios.get<SettingsData>('/api/settings')
      setSettings(response.data)
    } catch (err) {
      setStatus('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setStatus(null)

    try {
      const response = await axios.put<SettingsData>('/api/settings', settings)
      setSettings(response.data)
      setStatus('Settings saved successfully')
    } catch (err) {
      setStatus('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-[#9E9E9E]">Configure detection thresholds, alerts, and notifications</p>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-[#9E9E9E]">Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={saveSettings} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-[#9E9E9E]">Detection threshold</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.detection_threshold}
                  onChange={(e) => setSettings({ ...settings, detection_threshold: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#303030] bg-[#121212] px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#9E9E9E]">Auto-acknowledge minutes</label>
                <input
                  type="number"
                  min="0"
                  value={settings.auto_acknowledge_minutes}
                  onChange={(e) => setSettings({ ...settings, auto_acknowledge_minutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-[#303030] bg-[#121212] px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-[#303030] bg-[#121212] p-4">
                <input
                  type="checkbox"
                  checked={settings.alert_on_person}
                  onChange={(e) => setSettings({ ...settings, alert_on_person: e.target.checked })}
                />
                <span className="text-sm">Alert on person detection</span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-[#303030] bg-[#121212] p-4">
                <input
                  type="checkbox"
                  checked={settings.alert_on_bag}
                  onChange={(e) => setSettings({ ...settings, alert_on_bag: e.target.checked })}
                />
                <span className="text-sm">Alert on bag detection</span>
              </label>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-[#303030] bg-[#121212] p-4">
                <input
                  type="checkbox"
                  checked={settings.alert_on_backpack}
                  onChange={(e) => setSettings({ ...settings, alert_on_backpack: e.target.checked })}
                />
                <span className="text-sm">Alert on backpack detection</span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-[#303030] bg-[#121212] p-4">
                <input
                  type="checkbox"
                  checked={settings.notification_enabled}
                  onChange={(e) => setSettings({ ...settings, notification_enabled: e.target.checked })}
                />
                <span className="text-sm">Push notifications enabled</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#9E9E9E]">Camera sources</label>
              <textarea
                value={settings.camera_sources.join('\n')}
                onChange={(e) => setSettings({ ...settings, camera_sources: e.target.value.split('\n').map((source) => source.trim()).filter(Boolean) })}
                className="w-full rounded-xl border border-[#303030] bg-[#121212] px-3 py-2 text-sm outline-none focus:border-blue-500"
                rows={4}
              />
            </div>

            {status && (
              <div className="rounded-xl border border-[#303030] bg-[#121212] px-4 py-3 text-sm text-[#9E9E9E]">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
