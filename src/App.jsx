import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell.jsx'
import Home from './pages/Home.jsx'
import Prediction from './pages/Prediction.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MapPage from './pages/MapPage.jsx'
import Explainability from './pages/Explainability.jsx'
import Chatbot from './pages/Chatbot.jsx'
import History from './pages/History.jsx'

function PredictAlias() {
  const loc = useLocation()
  return <Navigate to="/prediction" replace state={loc.state} />
}

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<PredictAlias />} />
        <Route path="/prediction" element={<Prediction />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/explain" element={<Explainability />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </AppShell>
  )
}
