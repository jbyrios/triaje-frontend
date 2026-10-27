import axios from 'axios'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import './App.css'

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function App() {
  const [ubicacion, setUbicacion] = useState(null)
  const [hospitales, setHospitales] = useState([])
  const [resultado, setResultado] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    tipo_documento: 'CC',
    edad: 30,
    telefono: '',
    contacto_emergencia: '',
    telefono_emergencia: '',
    motivo: '',
    presion_sistolica: 120,
    presion_diastolica: 80,
    temperatura: 36.5,
    frecuencia_cardiaca: 80,
    saturacion_oxigeno: 98,
    nivel_dolor: 0,
    dificultad_respiratoria: 0
  })

  // Obtener ubicación del paciente
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Si no da permiso, usa una ubicación por defecto (Medellín)
        setUbicacion({ lat: 6.2442, lng: -75.5812 })
      }
    )
  }, [])

  // Cargar hospitales cercanos
  useEffect(() => {
    if (ubicacion) {
      axios.post('https://triaje-hospitalario.onrender.com/api/hospitales-cercanos', {
        latitud: ubicacion.lat,
        longitud: ubicacion.lng
      }).then(res => setHospitales(res.data))
        .catch(err => console.error(err))
    }
  }, [ubicacion])

  // Enviar triaje
  const enviarTriaje = async () => {
    if (!ubicacion) return alert('Necesitas activar la ubicación')

    try {
      const res = await axios.post('https://triaje-hospitalario.onrender.com/api/triaje', {
        ...form,
        latitud: ubicacion.lat,
        longitud: ubicacion.lng
      })
      setResultado(res.data)
    } catch (err) {
      alert('Error al enviar triaje: ' + (err.response?.data?.error || err.message))
    }
  }

  const colorPrioridad = {
    Rojo: '#E63946',
    Naranja: '#F77F00',
    Amarillo: '#FFC300',
    Verde: '#2A9D8F',
    Azul: '#457B9D'
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🏥 Sistema de Triaje Hospitalario</h1>
        <p>Medellín, Colombia</p>
      </header>

      <div className="contenedor">
        {/* Formulario */}
        <div className="formulario">
          <h2>Datos del paciente</h2>

          <label>Nombre:</label>
          <input value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })} />

          <label>Tipo de documento:</label>
          <select value={form.tipo_documento}
            onChange={e => setForm({ ...form, tipo_documento: e.target.value })}>
            <option value="CC">CC - Cédula de ciudadanía</option>
            <option value="TI">TI - Tarjeta de identidad</option>
            <option value="CE">CE - Cédula de extranjería</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>

          <label>Número de documento:</label>
          <input value={form.documento}
            onChange={e => setForm({ ...form, documento: e.target.value })} />

          <label>Edad:</label>
          <input type="number" value={form.edad}
            onChange={e => setForm({ ...form, edad: +e.target.value })} />

          <label>Teléfono:</label>
          <input value={form.telefono}
            onChange={e => setForm({ ...form, telefono: e.target.value })} />

          <label>Contacto de emergencia:</label>
          <input value={form.contacto_emergencia}
            onChange={e => setForm({ ...form, contacto_emergencia: e.target.value })} />

          <label>Teléfono de emergencia:</label>
          <input value={form.telefono_emergencia}
            onChange={e => setForm({ ...form, telefono_emergencia: e.target.value })} />

          <label>Motivo de consulta:</label>
          <input value={form.motivo}
            onChange={e => setForm({ ...form, motivo: e.target.value })} />

          <h3>Signos vitales</h3>

          <label>Presión sistólica:</label>
          <input type="number" value={form.presion_sistolica}
            onChange={e => setForm({ ...form, presion_sistolica: +e.target.value })} />

          <label>Presión diastólica:</label>
          <input type="number" value={form.presion_diastolica}
            onChange={e => setForm({ ...form, presion_diastolica: +e.target.value })} />

          <label>Temperatura:</label>
          <input type="number" step="0.1" value={form.temperatura}
            onChange={e => setForm({ ...form, temperatura: +e.target.value })} />

          <label>Frecuencia cardíaca:</label>
          <input type="number" value={form.frecuencia_cardiaca}
            onChange={e => setForm({ ...form, frecuencia_cardiaca: +e.target.value })} />

          <label>Saturación de oxígeno:</label>
          <input type="number" value={form.saturacion_oxigeno}
            onChange={e => setForm({ ...form, saturacion_oxigeno: +e.target.value })} />

          <label>Nivel de dolor (0-10):</label>
          <input type="number" value={form.nivel_dolor}
            onChange={e => setForm({ ...form, nivel_dolor: +e.target.value })} />

          <label>Dificultad respiratoria (0-3):</label>
          <input type="number" value={form.dificultad_respiratoria}
            onChange={e => setForm({ ...form, dificultad_respiratoria: +e.target.value })} />

          <button onClick={enviarTriaje}>Enviar triaje</button>
        </div>

        {/* Mapa */}
        <div className="mapa">
          <h2>Hospitales cercanos</h2>
          {ubicacion ? (
            <MapContainer center={[ubicacion.lat, ubicacion.lng]} zoom={13}
              style={{ height: '500px', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <Marker position={[ubicacion.lat, ubicacion.lng]}>
                <Popup>Tú estás aquí</Popup>
              </Marker>
              <Circle center={[ubicacion.lat, ubicacion.lng]} radius={300}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }} />

              {hospitales.map(h => (
                <Marker key={h.id} position={[h.latitud, h.longitud]}>
                  <Popup>
                    <b>{h.nombre}</b><br />
                    {h.direccion}<br />
                    Tel: {h.telefono}<br />
                    Distancia: {h.distancia_km} km
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <p>Cargando mapa...</p>
          )}
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="resultado" style={{ borderColor: colorPrioridad[resultado.prioridad] }}>
          <h2>Triaje registrado</h2>
          <p><b>Puntaje:</b> {resultado.puntaje}</p>
          <p><b>Prioridad:</b> <span style={{ color: colorPrioridad[resultado.prioridad], fontWeight: 'bold' }}>{resultado.prioridad}</span></p>
          <p><b>Hospital notificado:</b> {resultado.hospital.nombre}</p>
          <p><b>Dirección:</b> {resultado.hospital.direccion}</p>
          <p><b>Teléfono:</b> {resultado.hospital.telefono}</p>
          <p><b>Distancia:</b> {resultado.hospital.distancia_km} km</p>
          <p style={{ color: 'green', fontWeight: 'bold' }}>🏥 El hospital ha sido notificado. Ve de inmediato.</p>
        </div>
      )}
    </div>
  )
}

export default App
