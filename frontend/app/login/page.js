'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers, ShieldAlert, CheckCircle, Database, Loader2, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados del Seeder
  const [seeding, setSeeding] = useState(false);
  const [seedLogs, setSeedLogs] = useState([]);
  const [showSeedLogs, setShowSeedLogs] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa correo y contraseña.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authApi.login(email, password);
      setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas o error en el servicio de usuarios.');
      setLoading(false);
    }
  };

  const handleAutofill = (type) => {
    setError('');
    if (type === 'admin') {
      setEmail('admin@coworking.com');
      setPassword('AdminPassword123!');
    } else {
      setEmail('member@coworking.com');
      setPassword('MemberPassword123!');
    }
  };

  const handleRunSeed = async () => {
    setSeeding(true);
    setSeedLogs(['Iniciando proceso de semilla...']);
    setShowSeedLogs(true);
    setError('');

    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedLogs(data.logs || ['✅ Semilla ejecutada con éxito.']);
        setSuccess('¡Base de datos poblada! Credenciales listas para usar.');
      } else {
        setSeedLogs(data.logs || ['❌ Error al ejecutar el script de semilla.']);
        setError('Ocurrió un error al poblar la base de datos.');
      }
    } catch (err) {
      setSeedLogs(prev => [...prev, `❌ Error: ${err.message}`]);
      setError('No se pudo establecer conexión con el endpoint de semilla.');
    } finally {
      setSeeding(false);
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
      {/* CARD DE LOGIN */}
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
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Bienvenido de nuevo</h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>
            Inicia sesión para reservar y administrar tus espacios de trabajo.
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="login-form">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="email-input">Correo Electrónico</label>
            <input
              type="email"
              id="email-input"
              className="form-input"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || seeding}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="password-input">Contraseña</label>
            <input
              type="password"
              id="password-input"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || seeding}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-glow"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading || seeding}
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Iniciando Sesión...
              </>
            ) : (
              <>
                Entrar <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
          ¿No tienes una cuenta?{' '}
          <Link href="/register" style={{ color: 'hsl(var(--color-primary))', textDecoration: 'none', fontWeight: 600 }}>
            Regístrate aquí
          </Link>
        </div>

        {/* PANEL DE DESARROLLO (DEMO CREDENTIALS & SEED) */}
        <div style={{
          borderTop: '1px solid hsl(var(--border-glass))',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🛠️ Herramientas de Desarrollo
          </span>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}
              onClick={() => handleAutofill('member')}
              disabled={loading || seeding}
              id="autofill-member-btn"
            >
              <span>Miembro Demo</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>member@coworking.com</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}
              onClick={() => handleAutofill('admin')}
              disabled={loading || seeding}
              id="autofill-admin-btn"
            >
              <span>Admin Demo</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>admin@coworking.com</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '10px', fontSize: '0.8rem', gap: '6px', color: '#a5b4fc', borderColor: 'hsl(var(--color-primary) / 0.3)' }}
            onClick={handleRunSeed}
            disabled={loading || seeding}
            id="run-seed-btn"
          >
            {seeding ? (
              <>
                <Loader2 className="animate-spin" size={14} /> Poblando Datos...
              </>
            ) : (
              <>
                <Database size={14} /> Poblar Base de Datos (Seed)
              </>
            )}
          </button>

          {/* VISUALIZADOR DE LOGS DE SEMILLA */}
          {showSeedLogs && (
            <div style={{
              background: '#020617',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              maxHeight: '130px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              color: '#94a3b8'
            }}>
              {seedLogs.map((l, idx) => (
                <div key={idx} style={{
                  color: l.startsWith('✅') ? '#34d399' : l.startsWith('❌') ? '#f87171' : l.startsWith('ℹ️') ? '#60a5fa' : '#94a3b8'
                }}>
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
