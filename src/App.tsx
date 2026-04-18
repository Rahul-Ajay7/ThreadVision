import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Detection from './pages/Detection'
import Logs from './pages/Logs'
import Alerts from './pages/Alerts'
import Person from './pages/Person'
import Bags from './pages/Bags'
import Settings from './pages/Settings'
import Help from './pages/Help'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="detection" element={<Detection />} />
          <Route path="logs" element={<Logs />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="person" element={<Person />} />
          <Route path="bags" element={<Bags />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
