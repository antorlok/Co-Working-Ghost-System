'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, billingApi, authApi } from '@/lib/api';
import { CreditCard, DollarSign, ArrowUpRight, TrendingUp, AlertCircle, CheckCircle, RefreshCw, BarChart2, List, Loader2, Printer, ChevronDown, X } from 'lucide-react';

export default function BillingPage() {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('facturas'); // 'facturas' o 'analiticas' (solo admin)
  
  // Filtros y ordenamiento
  const [sortField, setSortField] = useState('creado_en');
  const [sortDir, setSortDir] = useState('desc');
  const [filterUser, setFilterUser] = useState('');
  
  const [usersMap, setUsersMap] = useState({});
  const [searchVal, setSearchVal] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

  // Reportes y Analíticas (Admin)
  const [summary, setSummary] = useState(null);
  const [reportSpace, setReportSpace] = useState([]);
  const [reportUser, setReportUser] = useState([]);
  const [reportMonthly, setReportMonthly] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Modales
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');
  const [submitting, setSubmitting] = useState(false);

  // Detalle factura modal (Member & Admin)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Sistema de Diálogos Customizados (Modales en lugar de alert/confirm)
  const [customAlert, setCustomAlert] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success', // 'success' | 'error' | 'confirm'
    onConfirm: null
  });

  useEffect(() => {
    setUser(getCurrentUser());
    fetchData();
  }, [sortField, sortDir, filterUser]);

  const fetchData = async () => {
    setLoading(true);
    const currentUser = getCurrentUser();
    try {
      // Cargar lista de usuarios para cruzar datos
      try {
        const allUsers = await authApi.getUsers();
        const map = {};
        allUsers.forEach(u => {
          map[u.id] = { name: u.name, email: u.email };
        });
        setUsersMap(map);
      } catch (err) {
        console.error('Error al obtener lista de usuarios:', err);
      }

      if (currentUser?.role === 'admin') {
        // Cargar todas las facturas con filtros y orden
        const data = await billingApi.getInvoices({
          usuarioId: filterUser || undefined,
          ordenar: sortField,
          direccion: sortDir
        });
        setInvoices(data || []);
        
        // Cargar reportes si la pestaña activa es analíticas
        if (activeTab === 'analiticas') {
          fetchReports();
        }
      } else {
        // Cargar mis facturas
        const data = await billingApi.getInvoices();
        setInvoices(data || []);
      }
    } catch (err) {
      console.error('Error al obtener facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const [sum, space, usr, monthly] = await Promise.all([
        billingApi.getSummaryReport(),
        billingApi.getReportBySpace(),
        billingApi.getReportByUser(),
        billingApi.getMonthlyReport()
      ]);
      setSummary(sum);
      setReportSpace(space || []);
      setReportUser(usr || []);
      setReportMonthly(monthly || []);
    } catch (err) {
      console.error('Error al obtener reportes financieros:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analiticas' && user?.role === 'admin') {
      fetchReports();
    }
  }, [activeTab]);

  // Helper de alertas customizadas
  const showAlert = (title, message, type = 'success') => {
    setCustomAlert({ show: true, title, message, type, onConfirm: null });
  };

  const showConfirm = (title, message, onConfirm) => {
    setCustomAlert({ show: true, title, message, type: 'confirm', onConfirm });
  };

  const closeAlert = () => {
    setCustomAlert({ show: false, title: '', message: '', type: 'success', onConfirm: null });
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await billingApi.payInvoice(activeInvoice.id, paymentMethod);
      showAlert(
        'Pago Registrado',
        `Se ha registrado el pago para la Factura #INV-${activeInvoice.id} exitosamente mediante ${paymentMethod.toUpperCase()}.`,
        'success'
      );
      setPayModalOpen(false);
      fetchData();
      if (activeTab === 'analiticas') fetchReports();
    } catch (err) {
      showAlert('Error al Cobrar', 'No se pudo registrar el pago: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatFecha = (fechaStr) => {
    const f = new Date(fechaStr);
    return f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Calcular la altura proporcional de las barras SVG
  const getMaxMonthlyIngresos = () => {
    if (reportMonthly.length === 0) return 1;
    return Math.max(...reportMonthly.map(m => parseFloat(m.total_ingresos) || 0), 1);
  };

  const getMaxSpaceIngresos = () => {
    if (reportSpace.length === 0) return 1;
    return Math.max(...reportSpace.map(s => parseFloat(s.total_ingresos) || 0), 1);
  };

  // Filtrado reactivo en el cliente
  const filteredInvoices = invoices.filter(inv => {
    // 1. Filtrar por búsqueda
    const userObj = usersMap[inv.usuario_id] || {};
    const nameMatch = userObj.name?.toLowerCase().includes(searchVal.toLowerCase()) || false;
    const emailMatch = userObj.email?.toLowerCase().includes(searchVal.toLowerCase()) || false;
    const spaceMatch = inv.nombre_espacio?.toLowerCase().includes(searchVal.toLowerCase()) || false;
    const idMatch = inv.id.toString().includes(searchVal) || 
                    inv.reserva_id.toString().includes(searchVal) || 
                    inv.usuario_id.toString().includes(searchVal);
    const totalMatch = inv.total.toString().includes(searchVal);
    
    const matchesSearch = searchVal === '' || nameMatch || emailMatch || spaceMatch || idMatch || totalMatch;

    // 2. Filtrar por estado
    const matchesEstado = filterEstado === 'todos' || inv.estado.toLowerCase() === filterEstado.toLowerCase();

    return matchesSearch && matchesEstado;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* SELECTOR DE PESTAÑAS (Solo Admin) */}
      {user?.role === 'admin' && (
        <div className="glass-panel" style={{
          padding: '6px',
          display: 'flex',
          gap: '8px',
          borderRadius: '12px',
          maxWidth: '360px'
        }}>
          <button
            onClick={() => setActiveTab('facturas')}
            className={`btn ${activeTab === 'facturas' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px 16px', fontSize: '0.85rem' }}
            id="tab-invoices-btn"
          >
            <List size={16} /> Ledger de Facturas
          </button>
          <button
            onClick={() => setActiveTab('analiticas')}
            className={`btn ${activeTab === 'analiticas' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '8px 16px', fontSize: '0.85rem' }}
            id="tab-analytics-btn"
          >
            <BarChart2 size={16} /> Analíticas Financieras
          </button>
        </div>
      )}

      {/* VISTA 1: LEDGER DE FACTURAS */}
      {activeTab === 'facturas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* BARRA DE FILTROS & BÚSQUEDA */}
          <div className="glass-panel" style={{
            padding: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            borderRadius: '16px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', flex: 1 }}>
              {/* Búsqueda rápida */}
              <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Búsqueda Rápida</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Buscar por ID, Espacio, Miembro..."
                    className="form-input"
                    style={{ paddingLeft: '36px', paddingY: '8px', fontSize: '0.85rem' }}
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    id="search-billing-input"
                  />
                  <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>

              {/* Filtrar por Estado */}
              <div style={{ minWidth: '150px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Filtrar Estado</label>
                <select
                  className="form-select"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  id="filter-estado-select"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="pagado">Pagadas</option>
                  <option value="pendiente">Pendientes</option>
                </select>
              </div>

              {/* Filtrar por ID de Usuario (Solo Admin) */}
              {user?.role === 'admin' && (
                <div style={{ minWidth: '140px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Filtrar Usuario (ID)</label>
                  <input
                    type="number"
                    placeholder="ej. 2"
                    className="form-input"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    id="filter-user-input"
                  />
                </div>
              )}

              {/* Ordenar por campo (Solo Admin) */}
              {user?.role === 'admin' && (
                <div style={{ minWidth: '160px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Ordenar por</label>
                  <select
                    className="form-select"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    id="sort-field-select"
                  >
                    <option value="creado_en">Fecha de Creación</option>
                    <option value="total">Monto Total</option>
                    <option value="horas">Duración (Horas)</option>
                  </select>
                </div>
              )}

              {/* Dirección de orden (Solo Admin) */}
              {user?.role === 'admin' && (
                <div style={{ minWidth: '120px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Dirección</label>
                  <select
                    className="form-select"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={sortDir}
                    onChange={(e) => setSortDir(e.target.value)}
                    id="sort-direction-select"
                  >
                    <option value="desc">Descendente</option>
                    <option value="asc">Ascendente</option>
                  </select>
                </div>
              )}
            </div>

            <button onClick={fetchData} className="btn btn-secondary" style={{ alignSelf: 'end', padding: '10px 14px' }} id="refresh-billing-btn">
              <RefreshCw size={14} />
            </button>
          </div>

          {/* LEDGER TABLE */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--color-primary))' }} />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
                No se registran facturas que coincidan con la búsqueda o filtros aplicados.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table" id="invoices-table">
                  <thead>
                    <tr>
                      <th>Factura ID</th>
                      <th>Reserva ID</th>
                      <th>Miembro</th>
                      <th>Espacio</th>
                      <th>Fecha</th>
                      <th>Horas</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>#INV-{inv.id}</strong></td>
                        <td>#{inv.reserva_id}</td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{usersMap[inv.usuario_id]?.name || `Miembro #${inv.usuario_id}`}</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                              {usersMap[inv.usuario_id]?.email || `ID: ${inv.usuario_id}`}
                            </div>
                          </div>
                        </td>
                        <td>{inv.nombre_espacio}</td>
                        <td>{formatFecha(inv.creado_en || inv.fecha_inicio)}</td>
                        <td>{parseFloat(inv.horas).toFixed(1)} h</td>
                        <td><strong>${parseFloat(inv.total).toFixed(2)}</strong></td>
                        <td>
                          <span className={`badge ${inv.estado === 'pagado' ? 'badge-success' : 'badge-warning'}`}>
                            {inv.estado === 'pagado' ? 'Pagada' : 'Pendiente'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Ver detalle */}
                            <button
                              onClick={() => { setSelectedInvoice(inv); setDetailModalOpen(true); }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              id={`detail-inv-${inv.id}`}
                            >
                              Ver
                            </button>

                            {/* Registrar Pago (Solo Admin, si está pendiente) */}
                            {user?.role === 'admin' && inv.estado === 'pendiente' && (
                              <button
                                onClick={() => { setActiveInvoice(inv); setPayModalOpen(true); }}
                                className="btn btn-primary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                id={`pay-inv-${inv.id}`}
                              >
                                Cobrar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: ANALÍTICAS FINANCIERAS (Solo Admin) */}
      {activeTab === 'analiticas' && user?.role === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loadingReports ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'hsl(var(--color-primary))' }} />
            </div>
          ) : !summary ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
              Error al generar reportes. Asegúrate de tener facturas emitidas.
            </div>
          ) : (
            <>
              {/* METRIC CARDS GRID */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px'
              }}>
                {/* CARD 1 */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>INGRESOS TOTALES</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>${parseFloat(summary.total_ingresos).toFixed(2)}</span>
                    <TrendingUp size={20} style={{ color: '#10b981' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Facturado acumulado global</span>
                </div>

                {/* CARD 2 */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #4f46e5' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>PROMEDIO DE COBRO</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>${parseFloat(summary.promedio_factura).toFixed(2)}</span>
                    <ArrowUpRight size={20} style={{ color: '#818cf8' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Por cada reserva facturada</span>
                </div>

                {/* CARD 3 */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>PENDIENTES DE PAGO</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>{summary.pendientes_pago}</span>
                    <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Facturas emitidas sin cobrar</span>
                </div>

                {/* CARD 4 */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>EMITIDAS HOY</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>{summary.facturas_hoy}</span>
                    <CheckCircle size={20} style={{ color: '#3b82f6' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>Nuevas transacciones registradas</span>
                </div>
              </div>

              {/* REPORT CHARTS GRID */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
                gap: '24px'
              }} className="charts-grid">
                
                {/* CHART 1: MONTHLY EVOLUTION (Vertical SVG Bars) */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontFamily: 'Outfit' }}>Evolución de Ingresos Mensuales</h4>
                  {reportMonthly.length === 0 ? (
                    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No hay registros de cobros históricos.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* SVG Bar Chart container */}
                      <svg width="100%" height="220" style={{ background: '#020617', borderRadius: '8px', padding: '15px' }}>
                        {reportMonthly.map((m, idx) => {
                          const max = getMaxMonthlyIngresos();
                          const ingresosVal = parseFloat(m.total_ingresos) || 0;
                          const barHeight = (ingresosVal / max) * 130; // escala proporcional
                          const barWidth = 32;
                          const x = idx * (500 / Math.max(reportMonthly.length, 1)) + 40; // posicionar barras distribuidas
                          return (
                            <g key={m.mes || idx}>
                              {/* Glowing background bar */}
                              <rect
                                x={x}
                                y={160 - barHeight}
                                width={barWidth}
                                height={barHeight}
                                fill="url(#blue-purple-grad)"
                                rx="4"
                                opacity="0.8"
                              />
                              {/* Texto del total arriba de la barra */}
                              <text
                                x={x + barWidth / 2}
                                y={150 - barHeight}
                                fill="white"
                                fontSize="10"
                                textAnchor="middle"
                                fontWeight="bold"
                              >
                                ${Math.round(ingresosVal)}
                              </text>
                              {/* Texto del mes abajo de la barra */}
                              <text
                                x={x + barWidth / 2}
                                y="185"
                                fill="#94a3b8"
                                fontSize="10"
                                textAnchor="middle"
                              >
                                {m.mes}
                              </text>
                            </g>
                          );
                        })}
                        {/* Gradiente definitions */}
                        <defs>
                          <linearGradient id="blue-purple-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  )}
                </div>

                {/* CHART 2: SPACE PERFORMANCE (Horizontal SVG bars) */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontFamily: 'Outfit' }}>Ingresos Agrupados por Espacio</h4>
                  {reportSpace.length === 0 ? (
                    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>No hay registros de reservas en espacios.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#020617', padding: '16px', borderRadius: '8px', height: '220px', overflowY: 'auto' }}>
                      {reportSpace.map((s, idx) => {
                        const max = getMaxSpaceIngresos();
                        const ingresosVal = parseFloat(s.total_ingresos) || 0;
                        const percent = (ingresosVal / max) * 100;
                        return (
                          <div key={s.nombre_espacio || idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                              <span>{s.nombre_espacio} <span style={{ opacity: 0.6 }}>({s.total_facturas} res)</span></span>
                              <strong style={{ color: 'white' }}>${ingresosVal.toFixed(2)}</strong>
                            </div>
                            {/* Horizontal progress bar container */}
                            <div style={{ background: 'hsl(var(--border-glass))', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${percent}%`,
                                height: '100%',
                                background: 'linear-gradient(to right, #10b981, #3b82f6)',
                                borderRadius: '4px',
                                boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* USER RANKING TABLE */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                <h4 style={{ fontSize: '1.05rem', fontFamily: 'Outfit', marginBottom: '16px' }}>Top Clientes por Facturación Consolidada</h4>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Miembro</th>
                        <th>Reservas Realizadas</th>
                        <th>Monto Total Contribuido (USD)</th>
                        <th>Porcentaje del Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportUser.map((u, idx) => {
                        const totalColectado = parseFloat(summary.total_ingresos) || 1;
                        const ingresosVal = parseFloat(u.total_ingresos) || 0;
                        const userPercent = (ingresosVal / totalColectado) * 100;
                        return (
                          <tr key={u.usuario_id || idx}>
                            <td>
                              <div>
                                <div style={{ fontWeight: 600 }}>{usersMap[u.usuario_id]?.name || `Miembro #${u.usuario_id}`}</div>
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                                  {usersMap[u.usuario_id]?.email || `ID: ${u.usuario_id}`}
                                </div>
                              </div>
                            </td>
                            <td>{u.total_facturas} reservaciones agendadas</td>
                            <td><strong>${ingresosVal.toFixed(2)}</strong></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '40px', fontSize: '0.8rem' }}>{userPercent.toFixed(1)}%</span>
                                <div style={{ flex: 1, background: 'hsl(var(--border-glass))', height: '6px', borderRadius: '3px', overflow: 'hidden', maxWidth: '120px' }}>
                                  <div style={{ width: `${userPercent}%`, height: '100%', background: '#c084fc', borderRadius: '3px' }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL COBRAR FACTURA (ADMIN) */}
      {payModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '400px', padding: '30px',
            display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative'
          }}>
            <button onClick={() => setPayModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} id="close-pay-modal">
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit' }}>
              Registrar Pago Factura
            </h3>

            <div style={{ background: '#020617', padding: '14px', borderRadius: '10px', fontSize: '0.85rem' }}>
              <div><strong>Factura ID:</strong> #INV-{activeInvoice?.id}</div>
              <div style={{ marginTop: '4px' }}><strong>Monto Total a Cobrar:</strong> <span style={{ color: '#34d399', fontWeight: 'bold' }}>${parseFloat(activeInvoice?.total).toFixed(2)}</span></div>
            </div>

            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="payment-form">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="payment-method">Método de Pago</label>
                <select
                  id="payment-method"
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={submitting}
                >
                  <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo en Recepción</option>
                </select>
              </div>

              <button type="submit" className="btn btn-success btn-glow" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={submitting} id="payment-submit-btn">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Registrar Pago Exitoso'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE FACTURA (PRINTABLE / DETAILED VIEW) */}
      {detailModalOpen && selectedInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} className="modal-print-overlay">
          <div className="glass-panel printable-card" style={{
            width: '100%', maxWidth: '580px', padding: '40px 30px',
            display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative',
            background: '#090d16', border: '1px solid #1e293b'
          }}>
            
            {/* Cabecera modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }} className="modal-print-header">
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Comprobante Oficial de Reserva
                </span>
                <h3 style={{ fontSize: '1.6rem', fontFamily: 'Outfit', marginTop: '4px' }}>Factura #INV-{selectedInvoice.id}</h3>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handlePrint} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} id="print-btn">
                  <Printer size={14} /> Imprimir
                </button>
                <button onClick={() => setDetailModalOpen(false)} className="btn btn-secondary" style={{ padding: '8px' }} id="close-detail-modal">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Detalles generales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid hsl(var(--border-glass))', borderBottom: '1px solid hsl(var(--border-glass))', padding: '20px 0' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>EMITIDO POR</span>
                <strong>Ghost Coworking Space</strong>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>coworking@ghost.com</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>CLIENTE</span>
                <strong>{usersMap[selectedInvoice.usuario_id]?.name || `Cliente #${selectedInvoice.usuario_id}`}</strong>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>
                  {usersMap[selectedInvoice.usuario_id]?.email || `ID: ${selectedInvoice.usuario_id}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>Fecha Emisión: {formatFecha(selectedInvoice.creado_en)}</div>
              </div>
            </div>

            {/* Tabla de Conceptos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>DETALLE DEL CONCEPTO</span>
              <div style={{ background: '#020617', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <strong>Reserva de Espacio: {selectedInvoice.nombre_espacio}</strong>
                  <strong>${(parseFloat(selectedInvoice.precio_hora) * parseFloat(selectedInvoice.horas)).toFixed(2)}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                  Duración: {parseFloat(selectedInvoice.horas).toFixed(1)} horas a ${parseFloat(selectedInvoice.precio_hora).toFixed(2)}/hora
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Período: {formatFecha(selectedInvoice.fecha_inicio)} a {formatFecha(selectedInvoice.fecha_fin)}
                </div>
              </div>
            </div>

            {/* Totales y Pago */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '10px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>ESTADO DE PAGO</span>
                <span className={`badge ${selectedInvoice.estado === 'pagado' ? 'badge-success' : 'badge-warning'}`}>
                  {selectedInvoice.estado === 'pagado' ? `PAGADA (${selectedInvoice.metodo_pago})` : 'PENDIENTE DE PAGO'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px', textAlign: 'right', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-secondary))' }}>
                  <span>Subtotal:</span>
                  <span>${parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--text-secondary))' }}>
                  <span>IVA (16%):</span>
                  <span>${parseFloat(selectedInvoice.impuesto).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'white', fontWeight: 'bold', borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '6px', marginTop: '4px' }}>
                  <span>TOTAL:</span>
                  <span style={{ color: '#34d399' }}>${parseFloat(selectedInvoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SISTEMA DE ALERTA Y CONFIRMACIÓN CUSTOMIZADO (GLASSMOPHISM OVERLAY) */}
      {customAlert.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '380px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center',
            borderColor: customAlert.type === 'error' ? 'hsl(var(--color-danger)/0.3)' : 'hsl(var(--border-glass))'
          }}>
            <h4 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', color: customAlert.type === 'error' ? '#f87171' : 'white' }}>
              {customAlert.title}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
              {customAlert.message}
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
              {customAlert.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => { customAlert.onConfirm(); closeAlert(); }}
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: '0.8rem' }}
                    id="confirm-alert-btn"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={closeAlert}
                    className="btn btn-secondary"
                    style={{ padding: '8px 20px', fontSize: '0.8rem' }}
                    id="cancel-alert-btn"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={closeAlert}
                  className="btn btn-primary"
                  style={{ padding: '8px 30px', fontSize: '0.8rem' }}
                  id="ok-alert-btn"
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ESTILOS CSS DE IMPRESIÓN Y DISEÑO RESPONSIVO */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-card, .printable-card * {
            visibility: visible;
          }
          .printable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .printable-card text, .printable-card span, .printable-card strong, .printable-card td {
            color: black !important;
          }
          .modal-print-header button {
            display: none !important;
          }
          .modal-print-overlay {
            background: white !important;
            padding: 0 !important;
          }
        }
        
        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
