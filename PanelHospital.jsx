import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import './PanelHospital.css'

const socket = io('https://triaje-hospitalario.onrender.com')

function PanelHospital() {
    const [hospitalId, setHospitalId] = useState(0) // Iniciamos en 0 para saber que no ha cargado
    const [hospitalNombre, setHospitalNombre] = useState('')
    const [pacientes, setPacientes] = useState([])
    const [reporte, setReporte] = useState({ total: 0, rojos: 0, naranjas: 0, amarillos: 0, verdes: 0, azules: 0, atendidos: 0 })
    const [triajeSeleccionado, setTriajeSeleccionado] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    const [filtroPrioridad, setFiltroPrioridad] = useState('todas')
    const [cargando, setCargando] = useState(true) // Bloquea la vista hasta tener el ID
    const navigate = useNavigate()

    const [signos, setSignos] = useState({
        presion_sistolica: '', presion_diastolica: '', temperatura: '', frecuencia_cardiaca: '', saturacion_oxigeno: '', nivel_dolor: '', dificultad_respiratoria: ''
    })

    const colorPorPrioridad = { Rojo: '#dc2626', Naranja: '#ea580c', Amarillo: '#ca8a04', Verde: '#16a34a', Azul: '#2563eb' }

    // 1. Obtener el ID real del hospital antes de hacer cualquier otra cosa
    useEffect(() => {
        const id = localStorage.getItem('hospital_id')
        const nombre = localStorage.getItem('hospital_nombre')

        if (!id) {
            navigate('/');
            return
        }

        setHospitalId(parseInt(id))
        setHospitalNombre(nombre)
        setCargando(false) // Desbloqueamos la vista
    }, [navigate])

    // 2. WebSockets (solo se activan cuando ya hay un ID válido)
    useEffect(() => {
        if (hospitalId === 0) return;

        socket.emit('hospital_conectado', { hospital_id: hospitalId })
        socket.on('nuevo_paciente', (data) => { if (data.hospital_id === hospitalId) cargarTodo() })
        socket.on('paciente_llego', () => cargarTodo())
        socket.on('triaje_completado', () => cargarTodo())
        socket.on('paciente_atendido', () => cargarTodo())

        return () => {
            socket.off('nuevo_paciente'); socket.off('paciente_llego');
            socket.off('triaje_completado'); socket.off('paciente_atendido');
        }
    }, [hospitalId])

    // 3. Cargar datos (solo cuando el ID está listo)
    useEffect(() => {
        if (hospitalId > 0) {
            cargarTodo()
            const intervalo = setInterval(cargarTodo, 3000)
            return () => clearInterval(intervalo)
        }
    }, [hospitalId])

    const cargarTodo = async () => {
        if (!hospitalId) return;
        try {
            const res = await axios.get(`https://triaje-hospitalario.onrender.com/api/cola/${hospitalId}`)
            // Filtro extra de seguridad
            const todos = res.data.filter(p => Number(p.hospital_notificado_id) === Number(hospitalId))
            setPacientes(todos)

            const rep = await axios.get(`https://triaje-hospitalario.onrender.com/api/reporte/${hospitalId}`)
            setReporte(rep.data.reporte)
        } catch (err) { console.error(err) }
    }

    const confirmarLlegada = async (id) => { await axios.put(`https://triaje-hospitalario.onrender.com/api/confirmar-llegada/${id}`); cargarTodo() }
    const atenderPaciente = async (id) => { await axios.put(`https://triaje-hospitalario.onrender.com/api/atender/${id}`); cargarTodo() }

    const reevaluarPaciente = async (id) => {
        if (!window.confirm("¿Aplicar Regla de Equidad? (Subirá 3 puntos de prioridad)")) return;
        await axios.put(`https://triaje-hospitalario.onrender.com/api/reevaluar/${id}`); cargarTodo()
    }

    const completarSignos = async () => {
        if (!triajeSeleccionado) return

        if (!signos.presion_sistolica || !signos.temperatura) {
            return alert("Por favor, ingrese al menos la presión sistólica y la temperatura.");
        }

        try {
            const datos = {
                presion_sistolica: parseInt(signos.presion_sistolica) || 0,
                presion_diastolica: parseInt(signos.presion_diastolica) || 0,
                temperatura: parseFloat(signos.temperatura) || 0,
                frecuencia_cardiaca: parseInt(signos.frecuencia_cardiaca) || 0,
                saturacion_oxigeno: parseInt(signos.saturacion_oxigeno) || 0,
                nivel_dolor: parseInt(signos.nivel_dolor) || 0,
                dificultad_respiratoria: parseInt(signos.dificultad_respiratoria) || 0
            }

            await axios.put(`https://triaje-hospitalario.onrender.com/api/completar-signos/${triajeSeleccionado}`, datos)

            setTriajeSeleccionado(null)
            setSignos({ presion_sistolica: '', presion_diastolica: '', temperatura: '', frecuencia_cardiaca: '', saturacion_oxigeno: '', nivel_dolor: '', dificultad_respiratoria: '' })

            cargarTodo()
        } catch (err) {
            console.error(err)
            alert('Error al guardar signos: ' + (err.response?.data?.error || err.message))
        }
    }

    const cerrarSesion = () => { localStorage.clear(); navigate('/') }

    const pacientesFiltrados = pacientes.filter(p => {
        const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.documento.includes(busqueda);
        const coincidePrioridad = filtroPrioridad === 'todas' ? true : p.prioridad === filtroPrioridad;
        return coincideBusqueda && coincidePrioridad;
    });

    // SI NO HA CARGADO EL ID, NO DIBUJAMOS NADA (Evita el efecto fantasma)
    if (cargando) {
        return <div className="layout-pantalla" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando panel...</div>
    }

    return (
        <div className="layout-pantalla">
            <header className="topbar" style={{ backgroundColor: '#0A2540', borderBottom: '2px solid #1E3A5F' }}>
                <div className="topbar-info">
                    <h1 style={{ color: '#FFFFFF', fontSize: '22px', fontWeight: '700', marginBottom: '2px' }}>
                        {hospitalNombre}
                    </h1>
                    <h2 style={{ color: '#8BA3C7', fontSize: '13px', fontWeight: '500' }}>
                        Sistema de triaje hospitalario
                    </h2>
                </div>
                <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span className="estado-sistema" style={{ color: '#22C55E', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="dot" style={{ width: '8px', height: '8px', backgroundColor: '#22C55E', borderRadius: '50%' }}></span> Activo
                    </span>
                    <button
                        className="btn-salir"
                        onClick={cerrarSesion}
                        style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#FFFFFF', padding: '8px 16px', fontSize: '13px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="indicadores-bar">
                    <div className="indicador">
                        <span className="ind-label">Total</span>
                        <span className="ind-value">{Number(reporte.total)}</span>
                    </div>
                    <div className="indicador">
                        <span className="ind-label">En espera</span>
                        <span className="ind-value">{Number(reporte.total - reporte.atendidos)}</span>
                    </div>
                    <div className="indicador">
                        <span className="ind-label">Prioridad alta</span>
                        <span className="ind-value">{Number(reporte.rojos + reporte.naranjas)}</span>
                    </div>
                    <div className="indicador">
                        <span className="ind-label">Atendidos</span>
                        <span className="ind-value">{Number(reporte.atendidos)}</span>
                    </div>
                </div>

                <div className="tabla-wrapper">
                    <div className="tabla-header">
                        <h3>Pacientes en espera</h3>
                        <div className="filtros">
                            <input
                                type="text"
                                placeholder="Buscar paciente..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="input-buscar"
                            />
                            <select
                                className="select-filtro"
                                value={filtroPrioridad}
                                onChange={(e) => setFiltroPrioridad(e.target.value)}
                            >
                                <option value="todas">Todas las prioridades</option>
                                <option value="Rojo">Rojo</option>
                                <option value="Naranja">Naranja</option>
                                <option value="Amarillo">Amarillo</option>
                                <option value="Verde">Verde</option>
                                <option value="Azul">Azul</option>
                            </select>
                        </div>
                    </div>

                    <div className="tabla-contenedor">
                        <table>
                            <thead>
                                <tr>
                                    <th>Paciente</th>
                                    <th>Motivo</th>
                                    <th>Prioridad</th>
                                    <th>Espera</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pacientesFiltrados.length === 0 ? (
                                    <tr className="fila-vacia">
                                        <td colSpan="6">
                                            <div className="estado-vacio">
                                                <strong>No hay pacientes pendientes</strong>
                                                <p>Los pacientes registrados aparecerán en esta lista.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pacientesFiltrados.map((p) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div className="nombre">{p.nombre}</div>
                                                <div className="documento">{p.documento}</div>
                                            </td>
                                            <td>{p.motivo}</td>
                                            <td>
                                                {p.tiene_signos ? (
                                                    <span className="badge-prioridad" style={{ color: colorPorPrioridad[p.prioridad], borderColor: colorPorPrioridad[p.prioridad] }}>
                                                        {p.prioridad} ({p.puntaje})
                                                    </span>
                                                ) : (
                                                    <span className="texto-gris">Sin clasificar</span>
                                                )}
                                            </td>
                                            <td>
                                                {p.estado === 'en_espera' ? (
                                                    <span className="tiempo-espera">{p.minutos_espera} min</span>
                                                ) : (
                                                    <span className="texto-gris">En camino</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge-estado ${p.estado}`}>
                                                    {p.estado.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="acciones">
                                                    {p.estado === 'en_camino' && (
                                                        <button className="btn-accion btn-sec" onClick={() => confirmarLlegada(p.id)}>Llegada</button>
                                                    )}
                                                    {p.estado === 'en_espera' && !p.tiene_signos && (
                                                        <button className="btn-accion btn-sec" onClick={() => setTriajeSeleccionado(p.id)}>Signos</button>
                                                    )}
                                                    {p.estado === 'en_espera' && p.tiene_signos && (
                                                        <>
                                                            <button className="btn-accion btn-pri" onClick={() => atenderPaciente(p.id)}>Atender</button>
                                                            <button className="btn-accion btn-sec" onClick={() => reevaluarPaciente(p.id)}>Reevaluar</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {triajeSeleccionado && (
                <div className="modal-overlay">
                    <div className="modal-caja">
                        <h2>Registro de signos vitales</h2>
                        <div className="form-grid">
                            <div className="form-group"><label>Presión Sistólica</label><input type="number" value={signos.presion_sistolica} onChange={e => setSignos({ ...signos, presion_sistolica: e.target.value })} /></div>
                            <div className="form-group"><label>Presión Diastólica</label><input type="number" value={signos.presion_diastolica} onChange={e => setSignos({ ...signos, presion_diastolica: e.target.value })} /></div>
                            <div className="form-group"><label>Temperatura</label><input type="number" value={signos.temperatura} onChange={e => setSignos({ ...signos, temperatura: e.target.value })} /></div>
                            <div className="form-group"><label>Frecuencia Cardíaca</label><input type="number" value={signos.frecuencia_cardiaca} onChange={e => setSignos({ ...signos, frecuencia_cardiaca: e.target.value })} /></div>
                            <div className="form-group"><label>Saturación O2</label><input type="number" value={signos.saturacion_oxigeno} onChange={e => setSignos({ ...signos, saturacion_oxigeno: e.target.value })} /></div>
                            <div className="form-group"><label>Nivel de Dolor</label><input type="number" value={signos.nivel_dolor} onChange={e => setSignos({ ...signos, nivel_dolor: e.target.value })} /></div>
                            <div className="form-group"><label>Dificultad Resp.</label><input type="number" value={signos.dificultad_respiratoria} onChange={e => setSignos({ ...signos, dificultad_respiratoria: e.target.value })} /></div>
                        </div>
                        <div className="modal-botones">
                            <button className="btn-accion btn-sec" onClick={() => setTriajeSeleccionado(null)}>Cancelar</button>
                            <button className="btn-accion btn-pri" onClick={completarSignos}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default PanelHospital
