import 'leaflet/dist/leaflet.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import Login from './Login.jsx'
import PanelHospital from './PanelHospital.jsx'
import RegistroPaciente from './RegistroPaciente.jsx'
import VistaPaciente from './VistaPaciente.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/paciente" element={<VistaPaciente />} />
        <Route path="/hospital" element={<PanelHospital />} />
        <Route path="/registro-paciente" element={<RegistroPaciente />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
