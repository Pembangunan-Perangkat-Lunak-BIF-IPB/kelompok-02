import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landingpage/landingpage'
import ParametersPage from './pages/parameterspage'
import StatusPage from './pages/statuspage'
import ResultPage from './pages/resultpage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* HARUS <LandingPage /> DENGAN L KAPITAL */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pipeline" element={<ParametersPage />} />
        <Route path="/status/:jobId" element={<StatusPage />} />
        <Route path="/result/:jobId" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  )
}