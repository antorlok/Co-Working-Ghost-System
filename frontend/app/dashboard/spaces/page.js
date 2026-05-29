'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, spacesApi, reservationsApi } from '@/lib/api';
import { Compass, Plus, Edit2, Trash2, Search, Loader2, Calendar, Users, DollarSign, X } from 'lucide-react';

export default function SpacesPage() {
  const [user, setUser] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  
  // Estados para modals
  const [spaceModalOpen, setSpaceModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState(null);
  const [spaceForm, setSpaceForm] = useState({ nombre: '', descripcion: '', capacidad: '', precio_por_hora: '', disponibilidad: true });
  const [bookingForm, setBookingForm] = useState({ fechaInicio: '', fechaFin: '', prioridad: '2', notas: '' });
  
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

  const showAlert = (title, message, type = 'success') => {
    setCustomAlert({ show: true, title, message, type, onConfirm: null });
  };

  const showConfirm = (title, message, onConfirm) => {
    setCustomAlert({ show: true, title, message, type: 'confirm', onConfirm });
  };

  const closeAlert = () => {
    setCustomAlert({ show: false, title: '', message: '', type: 'success', onConfirm: null });
  };

  useEffect(() => {
    setUser(getCurrentUser());
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const data = await spacesApi.getAll();
      setSpaces(data || []);
    } catch (err) {
      console.error('Error al obtener espacios:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar usando la API de búsqueda concurrente de Go
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (searchVal.trim() === '') {
        const data = await spacesApi.getAll();
        setSpaces(data || []);
      } else {
        const data = await spacesApi.search({ nombre: searchVal });
        setSpaces(data || []);
      }
    } catch (err) {
      console.error('Error al buscar espacios:', err);
    } finally {
      setLoading(false);
    }
  };

  // Guardar o Actualizar Espacio (Admin CRUD)
  const handleSpaceSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (activeSpace) {
        // Actualizar
        await spacesApi.update(activeSpace.id, spaceForm);
        setSuccessMsg('Espacio actualizado correctamente.');
      } else {
        // Crear
        await spacesApi.create(spaceForm);
        setSuccessMsg('Espacio creado correctamente.');
      }
      
      setTimeout(() => {
        setSpaceModalOpen(false);
        fetchSpaces();
        resetSpaceForm();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el espacio físico.');
      setSubmitting(false);
    }
  };

  const handleDeleteSpace = async (id, nombre) => {
    showConfirm(
      'Eliminar Espacio Físico',
      `¿Estás completamente seguro de que deseas eliminar el espacio "${nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await spacesApi.delete(id);
          showAlert('Completado', 'El espacio ha sido eliminado correctamente.', 'success');
          fetchSpaces();
        } catch (err) {
          showAlert('Error', 'No se pudo eliminar el espacio: ' + err.message, 'error');
        }
      }
    );
  };

  // Reservar Espacio (Member Reservation)
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (new Date(bookingForm.fechaInicio) >= new Date(bookingForm.fechaFin)) {
      setErrorMsg('La fecha de fin debe ser posterior a la fecha de inicio.');
      setSubmitting(false);
      return;
    }

    try {
      await reservationsApi.create({
        espacioId: activeSpace.id,
        nombreEspacio: activeSpace.nombre,
        fechaInicio: bookingForm.fechaInicio,
        fechaFin: bookingForm.fechaFin,
        prioridad: bookingForm.prioridad,
        notas: bookingForm.notas
      });

      setSuccessMsg('¡Reserva creada exitosamente! Verificada en cola Rust.');
      setTimeout(() => {
        setBookingModalOpen(false);
        resetBookingForm();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Error al agendar la reserva. Conflicto de horarios o servicio fuera de línea.');
      setSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setActiveSpace(null);
    setSpaceForm({ nombre: '', descripcion: '', capacidad: '', precio_por_hora: '', disponibilidad: true });
    setErrorMsg('');
    setSuccessMsg('');
    setSpaceModalOpen(true);
  };

  const openEditModal = (space) => {
    setActiveSpace(space);
    setSpaceForm({
      nombre: space.nombre,
      descripcion: space.descripcion || '',
      capacidad: space.capacidad,
      precio_por_hora: space.precio_por_hora,
      disponibilidad: space.disponibilidad
    });
    setErrorMsg('');
    setSuccessMsg('');
    setSpaceModalOpen(true);
  };

  const openBookingModal = (space) => {
    setActiveSpace(space);
    // Establecer fecha por defecto: hoy + 1 hora
    const now = new Date();
    now.setHours(now.getHours() + 2, 0, 0, 0); // Redondear
    const formattedNow = now.toISOString().slice(0, 16);
    
    const end = new Date(now);
    end.setHours(end.getHours() + 2); // 2 horas después
    const formattedEnd = end.toISOString().slice(0, 16);

    setBookingForm({
      fechaInicio: formattedNow,
      fechaFin: formattedEnd,
      prioridad: '2',
      notas: ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setBookingModalOpen(true);
  };

  const resetSpaceForm = () => {
    setSpaceForm({ nombre: '', descripcion: '', capacidad: '', precio_por_hora: '', disponibilidad: true });
    setActiveSpace(null);
  };

  const resetBookingForm = () => {
    setBookingForm({ fechaInicio: '', fechaFin: '', prioridad: '2', notas: '' });
    setActiveSpace(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* BARRA DE ACCIÓN (SEARCH & ADD) */}
      <div className="glass-panel" style={{
        padding: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        borderRadius: '16px'
      }}>
        {/* Formulario de Búsqueda */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '480px' }} id="spaces-search-form">
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Buscar espacios por nombre..."
              className="form-input"
              style={{ paddingLeft: '40px' }}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              id="search-input"
            />
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ padding: '12px' }} id="search-submit-btn">
            Buscar
          </button>
        </form>

        {/* Botón de crear (solo admin) */}
        {user?.role === 'admin' && (
          <button onClick={openCreateModal} className="btn btn-primary btn-glow" id="create-space-btn">
            <Plus size={18} /> Crear Espacio
          </button>
        )}
      </div>

      {/* CATÁLOGO DE ESPACIOS */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'hsl(var(--color-primary))' }} />
        </div>
      ) : spaces.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '16px', color: 'hsl(var(--text-secondary))' }}>
          No se encontraron espacios físicos creados en el sistema.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {spaces.map((space) => (
            <div key={space.id} className="glass-panel-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'Outfit' }}>{space.nombre}</h3>
                  <span className={`badge ${space.disponibilidad ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                    {space.disponibilidad ? 'Disponible' : 'Ocupado'}
                  </span>
                </div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem', lineHeight: 1.5, minHeight: '45px' }}>
                  {space.descripcion || 'Sin descripción detallada disponible.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>
                  <Users size={16} style={{ color: 'hsl(var(--color-primary))' }} />
                  <span>Capacidad: <strong>{space.capacidad}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>
                  <DollarSign size={16} style={{ color: 'hsl(var(--color-success))' }} />
                  <span>Tarifa: <strong>${parseFloat(space.precio_por_hora).toFixed(2)}/h</strong></span>
                </div>
              </div>

              {/* Botonera de acciones */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {user?.role === 'admin' ? (
                  <>
                    <button onClick={() => openEditModal(space)} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }} id={`edit-space-${space.id}`}>
                      <Edit2 size={14} /> Editar
                    </button>
                    <button onClick={() => handleDeleteSpace(space.id, space.nombre)} className="btn btn-danger" style={{ padding: '8px', fontSize: '0.8rem' }} id={`delete-space-${space.id}`}>
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openBookingModal(space)}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px' }}
                    disabled={!space.disponibilidad}
                    id={`book-space-${space.id}`}
                  >
                    <Calendar size={16} /> Reservar Ahora
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR/EDITAR ESPACIO (ADMIN) */}
      {spaceModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '480px', padding: '30px',
            display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative'
          }}>
            <button onClick={() => setSpaceModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} id="close-space-modal">
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit' }}>
              {activeSpace ? 'Editar Espacio Físico' : 'Crear Nuevo Espacio'}
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

            <form onSubmit={handleSpaceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="space-form">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="space-nombre">Nombre del Espacio</label>
                <input
                  type="text"
                  id="space-nombre"
                  className="form-input"
                  placeholder="ej. Sala de Juntas VIP"
                  value={spaceForm.nombre}
                  onChange={(e) => setSpaceForm({...spaceForm, nombre: e.target.value})}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="space-desc">Descripción</label>
                <textarea
                  id="space-desc"
                  className="form-input"
                  rows="3"
                  placeholder="ej. Sala equipada con Smart TV y clima central..."
                  value={spaceForm.descripcion}
                  onChange={(e) => setSpaceForm({...spaceForm, descripcion: e.target.value})}
                  disabled={submitting}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="space-capacidad">Capacidad (Personas)</label>
                  <input
                    type="number"
                    id="space-capacidad"
                    className="form-input"
                    placeholder="10"
                    min="1"
                    value={spaceForm.capacidad}
                    onChange={(e) => setSpaceForm({...spaceForm, capacidad: e.target.value})}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="space-precio">Tarifa por Hora (USD)</label>
                  <input
                    type="number"
                    id="space-precio"
                    className="form-input"
                    placeholder="15.00"
                    step="0.01"
                    min="0.5"
                    value={spaceForm.precio_por_hora}
                    onChange={(e) => setSpaceForm({...spaceForm, precio_por_hora: e.target.value})}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="space-disp"
                  checked={spaceForm.disponibilidad}
                  onChange={(e) => setSpaceForm({...spaceForm, disponibilidad: e.target.checked})}
                  disabled={submitting}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label className="form-label" htmlFor="space-disp" style={{ margin: 0, cursor: 'pointer' }}>¿El espacio está disponible para reservas?</label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={submitting} id="space-submit-btn">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Guardar Espacio'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESERVAR ESPACIO (MEMBER) */}
      {bookingModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '480px', padding: '30px',
            display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative'
          }}>
            <button onClick={() => setBookingModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }} id="close-booking-modal">
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit' }}>
              Agendar Reserva: <span style={{ color: 'hsl(var(--color-primary))' }}>{activeSpace?.nombre}</span>
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

            <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="booking-form">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="booking-start">Fecha e Hora de Inicio</label>
                <input
                  type="datetime-local"
                  id="booking-start"
                  className="form-input"
                  value={bookingForm.fechaInicio}
                  onChange={(e) => setBookingForm({...bookingForm, fechaInicio: e.target.value})}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="booking-end">Fecha e Hora de Fin</label>
                <input
                  type="datetime-local"
                  id="booking-end"
                  className="form-input"
                  value={bookingForm.fechaFin}
                  onChange={(e) => setBookingForm({...bookingForm, fechaFin: e.target.value})}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="booking-priority">Prioridad de Reserva</label>
                <select
                  id="booking-priority"
                  className="form-select"
                  value={bookingForm.prioridad}
                  onChange={(e) => setBookingForm({...bookingForm, prioridad: e.target.value})}
                  disabled={submitting}
                >
                  <option value="1">Urgente (Alta - Cola Priorizada)</option>
                  <option value="2">Normal (Media)</option>
                  <option value="3">Flexible (Baja)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="booking-notes">Notas / Requerimientos</label>
                <textarea
                  id="booking-notes"
                  className="form-input"
                  rows="3"
                  placeholder="ej. Requiere cable ethernet o proyector..."
                  value={bookingForm.notas}
                  onChange={(e) => setBookingForm({...bookingForm, notas: e.target.value})}
                  disabled={submitting}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-glow" style={{ width: '100%', padding: '12px', marginTop: '10px' }} disabled={submitting} id="booking-submit-btn">
                {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Confirmar Reserva'}
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

    </div>
  );
}
