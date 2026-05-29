'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, reservationsApi, billingApi, authApi } from '@/lib/api';
import { Calendar, RefreshCw, Check, Ban, DollarSign, Loader2, ArrowRight, ShieldCheck, Search, Filter, X, Users, MessageSquare } from 'lucide-react';

export default function ReservationsPage() {
  const [user, setUser] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);
  
  // Reactividad de Filtros
  const [searchVal, setSearchVal] = useState('');
  const [filterState, setFilterState] = useState('todos');
  const [filterPriority, setFilterPriority] = useState('todas');

  // Estado para facturación
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [activeReservation, setActiveReservation] = useState(null);
  const [billingForm, setBillingForm] = useState({ precioHora: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const currentUser = getCurrentUser();
    try {
      // 1. Obtener listado de usuarios (solo admin puede para cruce de datos)
      if (currentUser?.role === 'admin') {
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

        // 2. Obtener listado de facturas para saber cuáles reservas ya están facturadas
        try {
          const allInvoices = await billingApi.getInvoices();
          setInvoices(allInvoices || []);
        } catch (err) {
          console.error('Error al obtener facturas:', err);
        }

        // Cargar todas las reservas del sistema
        const allRes = await reservationsApi.getAll();
        setReservations(allRes || []);
        // Cargar estado de la cola Rust
        fetchQueueStatus();
      } else {
        // Cargar solo las mías
        const myRes = await reservationsApi.getMy();
        setReservations(myRes || []);
      }
    } catch (err) {
      console.error('Error al obtener reservaciones:', err);
      showAlert('Error', 'No se pudo conectar con los microservicios de reservación.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueStatus = async () => {
    setLoadingQueue(true);
    try {
      const data = await reservationsApi.getQueue();
      setQueueStatus(data);
    } catch (err) {
      console.error('Error al obtener estado de la cola Rust:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

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

  const handleCancelClick = (id) => {
    showConfirm(
      'Cancelar Reservación',
      '¿Estás completamente seguro de que deseas cancelar esta reservación física?',
      async () => {
        try {
          await reservationsApi.cancel(id);
          showAlert('Completado', 'La reservación ha sido cancelada correctamente.', 'success');
          fetchData();
        } catch (err) {
          showAlert('Error', 'No se pudo cancelar: ' + err.message, 'error');
        }
      }
    );
  };

  // Confirmar siguiente en cola (Dispara el algoritmo Heap Rust)
  const handleConfirmNext = async () => {
    setLoadingQueue(true);
    try {
      const result = await reservationsApi.confirmNextQueue();
      showAlert(
        'Algoritmo Rust Procesado',
        `La Reserva ID #${result.id} ha sido confirmada con éxito por el planificador prioritario en Rust.`,
        'success'
      );
      fetchData();
    } catch (err) {
      showAlert('Error en Cola', 'Error al confirmar siguiente reserva en la cola: ' + err.message, 'error');
      setLoadingQueue(false);
    }
  };

  // Facturar Reserva (Abre modal)
  const openBillingModal = (reserva) => {
    setActiveReservation(reserva);
    setBillingForm({
      precioHora: '15.00' // Precio base sugerido
    });
    setBillingModalOpen(true);
  };

  // Enviar Factura a billing-service (Node.js)
  const handleBillingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = await billingApi.createInvoice({
        reservaId: activeReservation.id,
        usuarioId: activeReservation.usuarioId,
        espacioId: activeReservation.espacioId,
        nombreEspacio: activeReservation.nombreEspacio || `Espacio #${activeReservation.espacioId}`,
        fechaInicio: activeReservation.fechaInicio,
        fechaFin: activeReservation.fechaFin,
        precioHora: billingForm.precioHora
      });

      setSuccessMsg('Factura generada con éxito.');
      showAlert('Facturación Completada', `Se ha generado la Factura #INV-${result.id} exitosamente en el billing-service.`, 'success');
      
      setTimeout(() => {
        setBillingModalOpen(false);
        fetchData();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al emitir la factura. Posiblemente ya tenga una factura emitida.');
      setSubmitting(false);
    }
  };

  const formatFecha = (fechaStr) => {
    const f = new Date(fechaStr);
    return f.toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getPriorityText = (prioridad) => {
    if (prioridad === 1) return 'Urgente';
    if (prioridad === 2) return 'Normal';
    return 'Flexible';
  };

  const getPriorityClass = (prioridad) => {
    if (prioridad === 1) return 'priority-urgente';
    if (prioridad === 2) return 'priority-normal';
    return 'priority-flexible';
  };

  // Comprobar el estado de facturación de una reserva
  const getInvoiceState = (reservaId) => {
    const fact = invoices.find(f => Number(f.reserva_id) === Number(reservaId));
    if (!fact) return null;
    return fact.estado; // 'pendiente' o 'pagado'
  };

  // Filtrado reactivo en el cliente
  const filteredReservations = reservations.filter(res => {
    // 1. Filtrar por búsqueda
    const nameMatch = usersMap[res.usuarioId]?.name?.toLowerCase().includes(searchVal.toLowerCase()) || false;
    const emailMatch = usersMap[res.usuarioId]?.email?.toLowerCase().includes(searchVal.toLowerCase()) || false;
    const spaceMatch = res.nombreEspacio?.toLowerCase().includes(searchVal.toLowerCase()) || false;
    const idMatch = res.id.toString().includes(searchVal) || res.usuarioId.toString().includes(searchVal);
    
    const matchesSearch = searchVal === '' || nameMatch || emailMatch || spaceMatch || idMatch;

    // 2. Filtrar por estado
    const matchesState = filterState === 'todos' || res.estado.toLowerCase() === filterState.toLowerCase();

    // 3. Filtrar por prioridad
    const matchesPriority = filterPriority === 'todas' || res.prioridad.toString() === filterPriority;

    return matchesSearch && matchesState && matchesPriority;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* COLA DE PRIORIDAD RUST (Solo Admin) */}
      {user?.role === 'admin' && (
        <div className="glass-panel" style={{
          padding: '24px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderLeft: '4px solid hsl(var(--color-primary))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'hsl(var(--color-primary))' }} /> Gestor de Cola de Espera (Rust Algorithm)
            </h3>
            <button onClick={fetchQueueStatus} className="btn btn-secondary" style={{ padding: '8px' }} disabled={loadingQueue} id="refresh-queue-btn">
              <RefreshCw size={14} className={loadingQueue ? 'animate-spin' : ''} /> Refrescar Cola
            </button>
          </div>

          {loadingQueue && !queueStatus ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--color-primary))' }} />
            </div>
          ) : !queueStatus || queueStatus.total_en_cola === 0 ? (
            <div style={{ background: '#020617', padding: '16px', borderRadius: '10px', color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', textAlign: 'center' }}>
              La cola de prioridad de Rust se encuentra vacía. No hay reservas pendientes.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'stretch' }} className="queue-grid">
              {/* Información Siguiente Reserva */}
              <div style={{ background: '#020617', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                  Siguiente Reserva en la Cola a Confirmar:
                </span>
                {queueStatus.siguiente ? (
                  <div>
                    <h4 style={{ fontSize: '1.05rem', color: '#818cf8', marginBottom: '4px' }}>
                      Reserva ID #{queueStatus.siguiente.id} - Espacio: {queueStatus.siguiente.nombreEspacio || `ID ${queueStatus.siguiente.espacioId}`}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                      Usuario: <strong>{usersMap[queueStatus.siguiente.usuarioId]?.name || `ID ${queueStatus.siguiente.usuarioId}`}</strong> ({usersMap[queueStatus.siguiente.usuarioId]?.email || 'Sin correo'})
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                      Prioridad: <strong>{getPriorityText(queueStatus.siguiente.prioridad)}</strong>
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>
                      Horas: {formatFecha(queueStatus.siguiente.fechaInicio)} a {formatFecha(queueStatus.siguiente.fechaFin)}
                    </p>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>Cargando detalles...</span>
                )}
              </div>

              {/* Botón de Acción Rust */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '20px', background: 'hsl(var(--color-primary)/0.05)', borderColor: 'hsl(var(--color-primary)/0.25)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: 'hsl(var(--color-primary))' }}>
                  {queueStatus.total_en_cola}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', textAlign: 'center', marginBottom: '4px' }}>
                  Reservas en Cola Rust
                </span>
                <button onClick={handleConfirmNext} className="btn btn-primary btn-glow pulse-glow" style={{ width: '100%', padding: '10px 14px', fontSize: '0.8rem' }} id="confirm-next-btn">
                  <Check size={16} /> Confirmar Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
          {/* Búsqueda general */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Búsqueda Rápida</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar por ID, Miembro, Espacio..."
                className="form-input"
                style={{ paddingLeft: '36px', paddingY: '8px', fontSize: '0.85rem' }}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                id="search-res-input"
              />
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
            </div>
          </div>

          {/* Filtrar por Estado */}
          <div style={{ minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filtrar Estado</label>
            <select
              className="form-select"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              id="filter-state-select"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmadas</option>
              <option value="en_cola">En Cola Rust</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {/* Filtrar por Prioridad */}
          <div style={{ minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Filtrar Prioridad</label>
            <select
              className="form-select"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              id="filter-priority-select"
            >
              <option value="todas">Todas las Prioridades</option>
              <option value="1">Urgente (Prioridad 1)</option>
              <option value="2">Normal (Prioridad 2)</option>
              <option value="3">Flexible (Prioridad 3)</option>
            </select>
          </div>
        </div>

        <button onClick={fetchData} className="btn btn-secondary" style={{ alignSelf: 'end', padding: '10px 14px' }} id="refresh-res-btn">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* DETALLES DE RESERVAS */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontFamily: 'Outfit', marginBottom: '20px' }}>
          {user?.role === 'admin' ? `Listado Global de Reservas (${filteredReservations.length})` : 'Mi Historial de Reservas'}
        </h3>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--color-primary))' }} />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            No se registran reservaciones que coincidan con los filtros aplicados.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table" id="reservations-table">
              <thead>
                <tr>
                  <th>Reserva ID</th>
                  <th>Miembro</th>
                  <th>Espacio Físico</th>
                  <th>Horario Agendado</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((res, idx) => {
                  const invState = getInvoiceState(res.id);
                  return (
                    <tr key={res.id || idx} className={getPriorityClass(res.prioridad)}>
                      <td><strong>#{res.id}</strong></td>
                      <td>
                        {user?.role === 'admin' ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{usersMap[res.usuarioId]?.name || 'Cargando miembro...'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                              {usersMap[res.usuarioId]?.email || `ID: ${res.usuarioId}`}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600 }}>Mi Cuenta</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{user?.email}</div>
                          </div>
                        )}
                      </td>
                      <td>{res.nombreEspacio || `Espacio #${res.espacioId}`}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{formatFecha(res.fechaInicio)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>hasta {formatFecha(res.fechaFin)}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                          {getPriorityText(res.prioridad)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          res.estado.toLowerCase() === 'confirmada' ? 'badge-success' :
                          res.estado.toLowerCase() === 'pendiente' ? 'badge-warning' :
                          res.estado.toLowerCase() === 'en_cola' || res.estado.toLowerCase() === 'encola' ? 'badge-info' : 'badge-danger'
                        }`}>
                          {res.estado.toLowerCase() === 'en_cola' || res.estado.toLowerCase() === 'encola' ? 'En Cola Rust' : res.estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {/* Cancelar (Miembro si está activa, Admin siempre que no sea cancelada) */}
                          {res.estado.toLowerCase() !== 'cancelada' && (
                            <button
                              onClick={() => handleCancelClick(res.id)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              id={`cancel-res-${res.id}`}
                            >
                              <Ban size={12} /> Cancelar
                            </button>
                          )}

                          {/* Facturar (Solo Admin, si la reserva está confirmada) */}
                          {user?.role === 'admin' && res.estado.toLowerCase() === 'confirmada' && (
                            <>
                              {!invState ? (
                                <button
                                  onClick={() => openBillingModal(res)}
                                  className="btn btn-success"
                                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                  id={`invoice-res-${res.id}`}
                                >
                                  <DollarSign size={12} /> Facturar
                                </button>
                              ) : (
                                <span className={`badge ${invState === 'pagado' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.7rem', padding: '6px 10px' }}>
                                  {invState === 'pagado' ? 'Pagada' : 'Facturada'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL GENERAR FACTURA (ADMIN) */}
      {billingModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '460px', padding: '30px',
            display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative'
          }}>
            <button onClick={() => setBillingModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} id="close-billing-modal">
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit' }}>
              Emitir Factura Comercial
            </h3>

            {errorMsg && (
              <div style={{ background: 'hsl(var(--color-danger)/12)', border: '1px solid hsl(var(--color-danger)/25)', color: '#fca5a5', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ background: 'hsl(var(--color-success)/12)', border: '1px solid hsl(var(--color-success)/25)', color: '#a7f3d0', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                {successMsg}
              </div>
            )}

            <div style={{ background: '#020617', padding: '14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Reserva ID:</strong> #{activeReservation?.id}</div>
              <div><strong>Miembro:</strong> {usersMap[activeReservation?.usuarioId]?.name || `ID ${activeReservation?.usuarioId}`} ({usersMap[activeReservation?.usuarioId]?.email})</div>
              <div><strong>Espacio Físico:</strong> {activeReservation?.nombreEspacio}</div>
              <div><strong>Fecha de Inicio:</strong> {formatFecha(activeReservation?.fechaInicio)}</div>
              <div><strong>Fecha de Término:</strong> {formatFecha(activeReservation?.fechaFin)}</div>
            </div>

            <form onSubmit={handleBillingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="invoice-form">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="billing-rate">Tarifa por Hora Cobrada (USD)</label>
                <input
                  type="number"
                  id="billing-rate"
                  className="form-input"
                  placeholder="15.00"
                  step="0.01"
                  min="0.5"
                  value={billingForm.precioHora}
                  onChange={(e) => setBillingForm({ precioHora: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-glow" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={submitting} id="invoice-submit-btn">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Generar Factura Comercial'}
              </button>
            </form>
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

      {/* ESTILOS CSS INLINE ADICIONALES */}
      <style jsx>{`
        @media (max-width: 768px) {
          .queue-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
