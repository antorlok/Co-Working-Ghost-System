import Link from 'next/link';
import { Layout, Compass, Calendar, CreditCard, ChevronRight, Layers, Cpu, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* NAVEGACIÓN */}
      <header className="glass-panel" style={{
        margin: '20px auto',
        width: '90%',
        maxWidth: '1200px',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-secondary)) 100%)',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={18} color="white" />
          </div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem', letterSpacing: '0.05em' }}>
            GHOST<span style={{ color: 'hsl(var(--color-primary))' }}>CO</span>
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '25px', fontSize: '0.9rem', fontWeight: 500 }}>
          <a href="#servicios" style={{ color: 'hsl(var(--text-secondary))', textDecoration: 'none', transition: 'color 0.2s' }}>Arquitectura</a>
          <a href="#caracteristicas" style={{ color: 'hsl(var(--text-secondary))', textDecoration: 'none', transition: 'color 0.2s' }}>Servicios</a>
        </nav>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} id="nav-login-btn">
            Iniciar Sesión
          </Link>
          <Link href="/register" className="btn btn-primary btn-glow" style={{ padding: '8px 18px', fontSize: '0.85rem' }} id="nav-register-btn">
            Registrarse
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main style={{ flex: 1 }}>
        <section style={{
          padding: '60px 20px 80px',
          textAlign: 'center',
          maxWidth: '900px',
          margin: '0 auto',
          position: 'relative'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'hsl(var(--color-primary) / 0.12)',
            border: '1px solid hsl(var(--color-primary) / 0.25)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#a5b4fc',
            marginBottom: '24px'
          }}>
            <Cpu size={14} /> Arquitectura Distribuida de Alta Escala
          </div>

          <h1 style={{
            fontFamily: 'Outfit',
            fontWeight: 800,
            fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
            lineHeight: 1.1,
            marginBottom: '20px',
            background: 'linear-gradient(to right, #ffffff, #c7d2fe, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em'
          }}>
            Espacios de Coworking <br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Futuristas & Inteligentes
            </span>
          </h1>

          <p style={{
            color: 'hsl(var(--text-secondary))',
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            maxWidth: '650px',
            margin: '0 auto 35px',
            lineHeight: 1.6
          }}>
            Reserva salas de juntas premium, escritorios dedicados y oficinas privadas. Gestionado con algoritmos eficientes en tiempo real y facturación automatizada.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/login" className="btn btn-primary btn-glow" style={{ padding: '14px 28px', fontSize: '1rem' }} id="hero-cta-btn">
              Explorar Espacios <ChevronRight size={18} />
            </Link>
            <Link href="/register?role=admin" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }} id="hero-admin-btn">
              Acceso Admin
            </Link>
          </div>
        </section>

        {/* ECOSYSTEM DIAGRAM SECTION */}
        <section id="servicios" style={{
          padding: '80px 20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>
              Ecosistema de Microservicios
            </h2>
            <p style={{ color: 'hsl(var(--text-secondary))', maxWidth: '600px', margin: '0 auto' }}>
              El sistema se compone de 4 microservicios especializados conectados a una base de datos PostgreSQL compartida y orquestados mediante Docker.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            {/* SERVICE 1 */}
            <div className="glass-panel" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                background: 'linear-gradient(to right, #3b82f6, #60a5fa)'
              }} />
              <div style={{ color: '#3b82f6', marginBottom: '16px' }}><ShieldCheck size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Autenticación & Usuarios</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '15px' }}>
                Desarrollado en **FastAPI (Python)**. Administra roles, membresías, inicios de sesión estateless y tokens criptográficos JWT autocontenidos.
              </p>
              <div className="badge" style={{ background: '#3b82f6/15', color: '#60a5fa', border: '1px solid #3b82f6/30' }}>FastAPI</div>
            </div>

            {/* SERVICE 2 */}
            <div className="glass-panel" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                background: 'linear-gradient(to right, #10b981, #34d399)'
              }} />
              <div style={{ color: '#10b981', marginBottom: '16px' }}><Compass size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Catálogo de Espacios</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '15px' }}>
                Desarrollado en **Go (Gin Gonic)**. Registra escritorios, oficinas y salas. Optimizado con algoritmos de ordenamiento y búsqueda concurrente en Go.
              </p>
              <div className="badge" style={{ background: '#10b981/15', color: '#34d399', border: '1px solid #10b981/30' }}>Go / Gin</div>
            </div>

            {/* SERVICE 3 */}
            <div className="glass-panel" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                background: 'linear-gradient(to right, #ec4899, #f472b6)'
              }} />
              <div style={{ color: '#ec4899', marginBottom: '16px' }}><Calendar size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Motor de Reservaciones</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '15px' }}>
                Desarrollado en **Rust (Axum)**. Controla la concurrencia de fechas y prioriza la cola de espera mediante un algoritmo avanzado Heap/Queue en Rust.
              </p>
              <div className="badge" style={{ background: '#ec4899/15', color: '#f472b6', border: '1px solid #ec4899/30' }}>Rust / Axum</div>
            </div>

            {/* SERVICE 4 */}
            <div className="glass-panel" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '4px',
                background: 'linear-gradient(to right, #eab308, #facc15)'
              }} />
              <div style={{ color: '#eab308', marginBottom: '16px' }}><CreditCard size={32} /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Facturación & Reportes</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '15px' }}>
                Desarrollado en **Node.js (Express)**. Emite facturas automáticas basándose en las horas de reserva e IVA. Agrupa analíticas de ingresos consolidados.
              </p>
              <div className="badge" style={{ background: '#eab308/15', color: '#facc15', border: '1px solid #eab308/30' }}>Node / Express</div>
            </div>
          </div>
        </section>

        {/* WORKSPACES PREVIEW */}
        <section id="caracteristicas" style={{
          padding: '80px 20px',
          background: 'rgba(255,255,255,0.01)',
          borderTop: '1px solid hsl(var(--border-glass))'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>
                Nuestros Espacios Premium
              </h2>
              <p style={{ color: 'hsl(var(--text-secondary))', maxWidth: '600px', margin: '0 auto' }}>
                Encuentra el ambiente perfecto adaptado a tu estilo de trabajo, disponible 24/7.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '30px'
            }}>
              {/* SPACE 1 */}
              <div className="glass-panel-glow" style={{ overflow: 'hidden', padding: '0px' }}>
                <div style={{
                  height: '200px',
                  background: 'linear-gradient(45deg, #1e1b4b, #311042)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  <Layers size={48} />
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Hot Desks Flexibles</h3>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Accede a cualquier escritorio en nuestra área común. Conéctate y comienza a programar de inmediato con café ilimitado y la comunidad de desarrolladores.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>$5.00 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>/ hora</span></span>
                    <span className="badge badge-success">Disponibilidad Inmediata</span>
                  </div>
                </div>
              </div>

              {/* SPACE 2 */}
              <div className="glass-panel-glow" style={{ overflow: 'hidden', padding: '0px' }}>
                <div style={{
                  height: '200px',
                  background: 'linear-gradient(45deg, #062f4f, #091727)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  <Cpu size={48} />
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Salas de Juntas IoT</h3>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Salas equipadas con pantallas inteligentes, audio premium y pizarra de ideas. Ideal para sprint plannings y reuniones con clientes de alto valor.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>$25.00 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>/ hora</span></span>
                    <span className="badge badge-info">Capacidad: 12 personas</span>
                  </div>
                </div>
              </div>

              {/* SPACE 3 */}
              <div className="glass-panel-glow" style={{ overflow: 'hidden', padding: '0px' }}>
                <div style={{
                  height: '200px',
                  background: 'linear-gradient(45deg, #1f2937, #111827)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  <Compass size={48} />
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Oficinas Ejecutivas Apex</h3>
                  <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    Oficinas completamente privadas para equipos pequeños o líderes independientes. Llave digital, aislamiento acústico y vistas excepcionales.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>$45.00 <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--text-secondary))' }}>/ hora</span></span>
                    <span className="badge badge-warning">Reserva Priorizada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="glass-panel" style={{
        margin: '40px auto 20px',
        width: '90%',
        maxWidth: '1200px',
        padding: '30px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'hsl(var(--text-secondary))'
      }}>
        <p style={{ marginBottom: '10px' }}>
          &copy; {new Date().getFullYear()} Ghost Coworking Platform. Todos los derechos reservados.
        </p>
        <p style={{ opacity: 0.6 }}>
          Construido como demostración de pair-programming. Arquitectura en Monorepo con FastAPI, Go, Rust y Express.
        </p>
      </footer>
    </div>
  );
}
