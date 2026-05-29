'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, ShieldAlert, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('member'); // 'member' o 'admin'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nombre || !email || !password || !confirmPassword) {
      setError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]+$/;
    if (!pwdRegex.test(password)) {
      setError('La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un símbolo especial (@$!%*?&._-).');
      return;
    }

    setLoading(true);

    try {
      await authApi.register(email, password, role, nombre);
      setSuccess('¡Registro completado con éxito! Redirigiendo al login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al registrar el usuario. Es posible que el correo ya esté en uso.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      position: 'relative'
    }}>
      {/* CARD DE REGISTRO */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px 30px',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '0.05em' }}>
            GHOST<span style={{ color: 'hsl(var(--color-primary))' }}>CO</span>
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Crea tu Cuenta</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>
            Únete a la plataforma premium de coworking y reserva tu espacio hoy.
          </p>
        </div>

        {/* MENSAJES DE ESTADO */}
        {error && (
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            background: 'hsl(var(--color-danger) / 0.12)',
            border: '1px solid hsl(var(--color-danger) / 0.25)',
            padding: '12px 16px',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '0.85rem'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            background: 'hsl(var(--color-success) / 0.12)',
            border: '1px solid hsl(var(--color-success) / 0.25)',
            padding: '12px 16px',
            borderRadius: '10px',
            color: '#a7f3d0',
            fontSize: '0.85rem'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="register-form">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="name-input">Nombre Completo</label>
            <input
              type="text"
              id="name-input"
              className="form-input"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="email-input">Correo Electrónico</label>
            <input
              type="email"
              id="email-input"
              className="form-input"
              placeholder="juan@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="role-select">Rol de Usuario</label>
            <select
              id="role-select"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="member">Miembro (Member)</option>
              <option value="admin">Administrador (Admin)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="password-input">Contraseña</label>
              <input
                type="password"
                id="password-input"
                className="form-input"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="confirm-password-input">Confirmar</label>
              <input
                type="password"
                id="confirm-password-input"
                className="form-input"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-glow"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading}
            id="register-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Registrando...
              </>
            ) : (
              <>
                Comenzar <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" style={{ color: 'hsl(var(--color-primary))', textDecoration: 'none', fontWeight: 600 }}>
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
