import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
    const [tipo, setTipo] = useState('paciente')
    const [documento, setDocumento] = useState('')
    const [usuario, setUsuario] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const loginPaciente = async () => {
        if (!documento) return setError('Ingrese su documento')
        try {
            const res = await axios.get(`https://triaje-hospitalario.onrender.com/api/verificar-paciente/${documento}`)
            if (res.data.existe) {
                localStorage.setItem('documento', documento)
                localStorage.setItem('paciente', JSON.stringify(res.data.paciente))
                navigate('/paciente')
            } else {
                localStorage.setItem('documento', documento)
                navigate('/registro-paciente')
            }
        } catch (err) {
            setError('Error al verificar el paciente')
        }
    }

    const loginHospital = async () => {
        if (!usuario || !password) return setError('Ingrese usuario y contraseña')
        try {
            const res = await axios.post('https://triaje-hospitalario.onrender.com/api/login', { usuario, password })
            if (res.data.success) {
                localStorage.setItem('hospital_id', res.data.hospital_id)
                localStorage.setItem('hospital_nombre', res.data.hospital_nombre)
                navigate('/hospital')
            }
        } catch (err) {
            setError('Credenciales incorrectas')
        }
    }

    return (
        <div className="layout-login">
            <div className="login-panel-brand">
                <h1>Sistema de Triaje</h1>
                <p>Plataforma de gestión y asignación de rutas para urgencias médicas en Medellín.</p>
            </div>
            <div className="login-panel-form">
                <div className="login-card">
                    <h2>Iniciar Sesión</h2>
                    <p className="subtitulo">Seleccione su tipo de acceso</p>

                    <div className="tabs">
                        <button className={tipo === 'paciente' ? 'activo' : ''} onClick={() => { setTipo('paciente'); setError('') }}>Paciente</button>
                        <button className={tipo === 'hospital' ? 'activo' : ''} onClick={() => { setTipo('hospital'); setError('') }}>Hospital</button>
                    </div>

                    {tipo === 'paciente' && (
                        <div className="formulario-login">
                            <label>Documento de Identidad</label>
                            <input type="text" value={documento} onChange={e => setDocumento(e.target.value)} placeholder="Ingrese su documento" />
                            <button onClick={loginPaciente}>Ingresar</button>
                            <p className="ayuda">Si es su primera vez, será redirigido al registro.</p>
                        </div>
                    )}

                    {tipo === 'hospital' && (
                        <div className="formulario-login">
                            <label>Usuario</label>
                            <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="pablotobon / general / sanvicente" />
                            <label>Contraseña</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="admin123" />
                            <button onClick={loginHospital}>Ingresar al Panel</button>
                        </div>
                    )}

                    {error && <p className="error">{error}</p>}
                </div>
            </div>
        </div>
    )
}
export default Login
