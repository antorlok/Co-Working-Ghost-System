'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Layout, Compass, Calendar, CreditCard, LogOut, User, Menu, X, Layers } from 'lucide-react';
import { getCurrentUser, removeToken } from '@/lib/api';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // Si no hay token válido, redirigir al login
      removeToken();
      router.push('/login');
    } else {
      setUser(currentUser);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '15px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid hsl(var(--border-glass))',
          borderTopColor: 'hsl(var(--color-primary))',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>Cargando sesión segura...</span>
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const menuItems = [
    { name: 'Espacios', path: '/dashboard/spaces', icon: Compass },
    { name: 'Reservaciones', path: '/dashboard/reservations', icon: Calendar },
    { name: 'Facturación', path: '/dashboard/billing', icon: CreditCard },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'hsl(var(--bg-cosmic))' }}>
      
      {/* SIDEBAR PARA PANTALLAS GRANDES */}
      <aside className="glass-panel sidebar-desktop" style={{
        width: '260px',
        margin: '20px 0 20px 20px',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        borderRadius: '16px',
        flexShrink: 0,
        display: sidebarOpen ? 'flex' : 'none', // Móvil toggle
      }}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '0.05em' }}>
            GHOST<span style={{ color: 'hsl(var(--color-primary))' }}>CO</span>
          </span>
        </div>

        {/* NAVEGACIÓN */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  color: isActive ? 'white' : 'hsl(var(--text-secondary))',
                  background: isActive ? 'hsl(var(--color-primary) / 0.15)' : 'transparent',
                  border: isActive ? '1px solid hsl(var(--color-primary) / 0.25)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                className={isActive ? '' : 'sidebar-link-hover'}
              >
                <Icon size={18} style={{ color: isActive ? 'hsl(var(--color-primary))' : 'inherit' }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '12px',
            padding: '12px 16px',
            width: '100%',
            fontSize: '0.9rem',
            color: '#f87171',
            borderColor: 'hsl(var(--color-danger) / 0.2)'
          }}
          id="sidebar-logout-btn"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}>
        {/* CABECERA (TOP HEADER) */}
        <header className="glass-panel" style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderRadius: '16px'
        }}>
          {/* MÓVIL MENU TOGGLE */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'none' // Manejado por CSS en móviles
            }}
            className="menu-toggle-btn"
            id="menu-toggle-btn"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <h2 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: 600 }}>
            {pathname === '/dashboard/spaces' && 'Explorar Espacios'}
            {pathname === '/dashboard/reservations' && 'Mis Reservaciones'}
            {pathname === '/dashboard/billing' && 'Facturación & Analíticas'}
          </h2>

          {/* PERFIL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 600, color: 'white' }}>{user.email.split('@')[0]}</span>
              <span className="badge" style={{
                fontSize: '0.65rem',
                padding: '2px 8px',
                marginTop: '3px',
                background: user.role === 'admin' ? 'hsl(var(--color-secondary) / 0.15)' : 'hsl(var(--color-success) / 0.15)',
                color: user.role === 'admin' ? '#c084fc' : '#34d399',
                borderColor: user.role === 'admin' ? 'hsl(var(--color-secondary) / 0.3)' : 'hsl(var(--color-success) / 0.3)'
              }}>
                {user.role === 'admin' ? 'ADMINISTRADOR' : 'MIEMBRO'}
              </span>
            </div>
            
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'hsl(var(--border-glass))',
              border: '1px solid hsl(var(--border-glass))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--text-secondary))'
            }}>
              <User size={18} />
            </div>
          </div>
        </header>

        {/* CONTAINER DEL CONTENIDO */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* ESTILOS CSS INLINE PARA DISEÑO RESPONSIVO */}
      <style jsx global>{`
        .sidebar-desktop {
          display: flex !important;
        }
        .sidebar-link-hover:hover {
          color: white !important;
          background: hsl(var(--border-glass)) !important;
        }
        .menu-toggle-btn {
          display: none;
        }
        
        @media (max-width: 768px) {
          .sidebar-desktop {
            position: fixed;
            top: 0;
            left: 0;
            height: calc(100vh - 40px);
            z-index: 50;
            display: ${sidebarOpen ? 'flex !important' : 'none !important'};
            width: 250px;
          }
          .menu-toggle-btn {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
