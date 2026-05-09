import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './components/Landing'
import AppShell from './components/AppShell'

export default function App() {
  return (
    <Routes>
      <Route path="/"    element={<Landing />} />
      <Route path="/app" element={<AppShell />} />
      <Route path="*"    element={<Navigate to="/" replace />} />
    </Routes>
  )
}
