import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landingpage/landingpage'
import ParametersPage from './pages/parameterspage'
import StatusPage from './pages/statuspage'
import ResultPage from './pages/resultpage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pipeline" element={<ParametersPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/status-analisis" element={<StatusPage />} />
        <Route path="/status/:jobId" element={<StatusPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/result/:jobId" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  )
}
