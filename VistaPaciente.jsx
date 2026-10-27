import axios from 'axios'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import './VistaPaciente.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function VistaPaciente() {
    const [paciente, setPaciente] = useState(null)
    const [ubicacion, setUbicacion] = useState({ lat: 6.2442, lng: -75.5812 })
    const [hospitales, setHospitales] = useState([])
    const [notificado, setNotificado] = useState(false)
    const [hospitalDestino, setHospitalDestino] = useState('')
    const navigate = useNavigate()

    const colorPorPrioridad = { Rojo: '#dc2626', Naranja: '#ea580c', Amarillo: '#ca8a04', Verde: '#16a34a', Azul: '#2563eb' }

    useEffect(() => {
        const documento = localStorage.getItem('documento')
        const pacienteGuardado = localStorage.getItem('paciente')

        if (!documento || !pacienteGuardado) {
            navigate('/')
            return
        }

        const cargarPaciente = async () => {
            try {
                const res = await axios.get(`https://triaje-hospitalario.onrender.com/api/verificar-paciente/${documento}`)
                if (res.data.existe) {
                    setPaciente(res.data.paciente)
                    if (res.data.paciente.estado === 'en_camino' || res.data.paciente.estado === 'en_espera') {
                        setNotificado(true)
                        setHospitalDestino(res.data.paciente.hospital_asignado)
                    }
                    localStorage.setItem('paciente', JSON.stringify(res.data.paciente))
                }
            } catch (err) { console.error(err) }
        }

        cargarPaciente()
        const intervalo = setInterval(cargarPaciente, 3000)

        navigator.geolocation.getCurrentPosition(
            (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => console.log("Usando ubicación por defecto")
        )

        return () => clearInterval(intervalo)
    }, [navigate])

    useEffect(() => {
        if (ubicacion) {
            axios.post('https://triaje-hospitalario.onrender.com/api/hospitales-cercanos', {
                latitud: ubicacion.lat, longitud: ubicacion.lng
            }).then(res => setHospitales(res.data)).catch(err => console.error(err))
        }
    }, [ubicacion])

    const notificarHospital = async () => {
        if (!paciente) return
        try {
            const res = await axios.post('https://triaje-hospitalario.onrender.com/api/notificar', {
                triaje_id: paciente.triaje_id, latitud: ubicacion.lat, longitud: ubicacion.lng
            })
            setHospitalDestino(res.data.hospital_asignado)
            setNotificado(true)
        } catch (err) { alert('Error al notificar al hospital.') }
    }

    const cerrarSesion = () => { localStorage.clear(); navigate('/') }

    if (!paciente) return null

    return (
        <div className="layout-pantalla">
            <header className="topbar">
                <div className="topbar-info">
                    <h1>Portal del Paciente</h1>
                    <span>{paciente.nombre} | Doc: {paciente.documento}</span>
                </div>
                <button className="btn-logout" onClick={cerrarSesion}>Cerrar Sesión</button>
            </header>

            <div className="main-content">
                <aside className="sidebar">

                    {/* RECUADRO DEL HOSPITAL RESALTADO */}
                    {notificado && hospitalDestino && (
                        <div className="hospital-destacado">
                            <span className="hospital-label">Diríjase a:</span>
                            <strong className="hospital-nombre">{hospitalDestino}</strong>
                        </div>
                    )}

                    <div className="data-group">
                        <div className="data-item">
                            <span className="data-label">Motivo de consulta</span>
                            <span className="data-value">{paciente.motivo}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Estado actual</span>
                            <span className="data-value">
                                {paciente.estado === 'en_casa' ? 'En casa (Sin notificar)' :
                                    paciente.estado === 'en_camino' ? 'En camino al hospital' :
                                        paciente.estado === 'en_espera' ? 'En espera en el hospital' : 'Atendido'}
                            </span>
                        </div>

                        {paciente.tiene_signos ? (
                            <>
                                <div className="data-item">
                                    <span className="data-label">Prioridad</span>
                                    <span className="data-value" style={{ color: colorPorPrioridad[paciente.prioridad], fontWeight: 'bold' }}>
                                        {paciente.prioridad}
                                    </span>
                                </div>
                                {paciente.estado === 'en_espera' && (
                                    <div className="data-item">
                                        <span className="data-label">Personas antes que usted</span>
                                        <span className="data-value">{paciente.personas_adelante}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="data-item">
                                <span className="data-label">Signos Vitales</span>
                                <span className="data-value text-muted">Pendientes por tomar en el hospital</span>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-footer">
                        {!notificado ? (
                            <button className="btn-primary" onClick={notificarHospital}>
                                Notificar que voy en camino
                            </button>
                        ) : (
                            <div className="status-badge-success">
                                El hospital ha sido notificado
                            </div>
                        )}
                    </div>
                </aside>

                <main className="map-area">
                    <MapContainer center={[ubicacion.lat, ubicacion.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[ubicacion.lat, ubicacion.lng]}>
                            <Popup>Su ubicación actual</Popup>
                        </Marker>
                        <Circle center={[ubicacion.lat, ubicacion.lng]} radius={300} pathOptions={{ color: '#0284c7', fillColor: '#0284c7', fillOpacity: 0.2 }} />
                        {hospitales.map(h => (
                            <Marker key={h.id} position={[h.latitud, h.longitud]}>
                                <Popup>
                                    <strong>{h.nombre}</strong><br />Distancia: {h.distancia_km} km
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </main>
            </div>
        </div>
    )
}
export default VistaPaciente
