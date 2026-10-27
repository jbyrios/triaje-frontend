import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RegistroPaciente.css'

function RegistroPaciente() {
    const [form, setForm] = useState({
        nombre: '',
        documento: '',
        tipo_documento: 'CC',
        edad: '',
        telefono: '',
        contacto_emergencia: '',
        telefono_emergencia: '',
        motivo: ''
    })
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const doc = localStorage.getItem('documento')
        if (!doc) {
            navigate('/')
            return
        }
        setForm(prev => ({ ...prev, documento: doc }))
    }, [navigate])

    const registrar = async () => {
        if (!form.nombre || !form.motivo || !form.edad) {
            return setError('Por favor complete nombre, edad y motivo de consulta.')
        }

        try {
            const res = await axios.post('https://triaje-hospitalario.onrender.com/api/registrar-paciente', {
                ...form,
                edad: parseInt(form.edad),
                latitud: 6.2442,
                longitud: -75.5812
            })

            localStorage.setItem('paciente', JSON.stringify({
                nombre: form.nombre,
                documento: form.documento,
                motivo: form.motivo,
                triaje_id: res.data.triaje_id,
                puntaje: null,
                prioridad: null,
                estado: 'en_casa'
            }))

            navigate('/paciente')
        } catch (err) {
            setError('Error al registrar los datos. Intente nuevamente.')
        }
    }

    return (
        <div className="layout-registro">
            <div className="registro-card">
                <h1>Registro de Paciente</h1>
                <p className="subtitulo">Complete sus datos personales para continuar con el triaje.</p>

                <div className="form-grid">
                    <div className="form-group full-width">
                        <label>Nombre completo</label>
                        <input value={form.nombre} placeholder="Ej: Juan Pérez" onChange={e => setForm({ ...form, nombre: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Tipo de documento</label>
                        <select value={form.tipo_documento} onChange={e => setForm({ ...form, tipo_documento: e.target.value })}>
                            <option value="CC">Cédula de Ciudadanía</option>
                            <option value="TI">Tarjeta de Identidad</option>
                            <option value="CE">Cédula de Extranjería</option>
                            <option value="Pasaporte">Pasaporte</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Número de documento</label>
                        <input value={form.documento} disabled />
                    </div>

                    <div className="form-group">
                        <label>Edad</label>
                        <input type="number" value={form.edad} placeholder="Ej: 30" onChange={e => setForm({ ...form, edad: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Teléfono</label>
                        <input value={form.telefono} placeholder="Ej: 3001234567" onChange={e => setForm({ ...form, telefono: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Nombre del contacto de emergencia</label>
                        <input value={form.contacto_emergencia} placeholder="Ej: María Pérez" onChange={e => setForm({ ...form, contacto_emergencia: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Teléfono de emergencia</label>
                        <input value={form.telefono_emergencia} placeholder="Ej: 3009876543" onChange={e => setForm({ ...form, telefono_emergencia: e.target.value })} />
                    </div>

                    <div className="form-group full-width">
                        <label>Motivo de consulta</label>
                        <input value={form.motivo} placeholder="Ej: Dolor en el pecho" onChange={e => setForm({ ...form, motivo: e.target.value })} />
                    </div>
                </div>

                {error && <p className="error">{error}</p>}

                <button className="btn-registrar" onClick={registrar}>Registrarme</button>
            </div>
        </div>
    )
}
export default RegistroPaciente
