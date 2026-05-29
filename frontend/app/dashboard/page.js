'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir de forma automática al catálogo de espacios como página de inicio
    router.replace('/dashboard/spaces');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      color: 'hsl(var(--text-secondary))',
      fontSize: '0.9rem'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '30px',
          height: '30px',
          border: '3px solid hsl(var(--border-glass))',
          borderTopColor: 'hsl(var(--color-primary))',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span>Cargando tu panel de control...</span>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
