export default function Help() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Help</h1>
        <p className="text-[#9E9E9E]">Need guidance? Use these notes to get started with ThreadVision.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Getting started</h2>
          <p className="text-sm text-[#9E9E9E]">Use the sidebar to navigate between dashboard, detection, logs, alerts, person tracking, bag detection, and settings.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Backend API</h2>
          <p className="text-sm text-[#9E9E9E]">The frontend uses the proxy configured in Vite to reach backend endpoints under <code className="rounded bg-[#121212] px-1 py-0.5">/api/*</code>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Feature status</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[#9E9E9E]">
            <li>Detection: upload an image and run the model.</li>
            <li>Logs: view recent system events from `/api/logs`.</li>
            <li>Alerts: acknowledge and review alerts from `/api/alerts`.</li>
            <li>Settings: change detection behavior and save to backend.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
