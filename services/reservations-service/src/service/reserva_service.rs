use std::sync::{Arc, Mutex};

use crate::algorithm::cola_prioridad::ColaPrioridad;
use crate::dto::request::ReservaRequest;
use crate::dto::response::{ColaEstadoResponse, ReservaResponse};
use crate::error::{AppError, AppResult};
use crate::models::reserva::{EstadoReserva, NuevaReserva};
use crate::repository::reserva_repo::ReservaRepository;

#[derive(Clone)]
pub struct ReservaService {
    repo: ReservaRepository,
    cola: Arc<Mutex<ColaPrioridad>>,
}

impl ReservaService {
    pub fn new(repo: ReservaRepository, cola: Arc<Mutex<ColaPrioridad>>) -> Self {
        Self { repo, cola }
    }

    pub async fn inicializar_cola(&self) -> AppResult<()> {
        let pendientes = self.repo.find_pendientes_ordered().await?;
        let mut cola = self
            .cola
            .lock()
            .map_err(|_| AppError::internal("cola de prioridad bloqueada"))?;
        for reserva in pendientes {
            cola.insertar(reserva);
        }
        tracing::info!(count = cola.tamanio(), "cola inicializada con reservas pendientes");
        Ok(())
    }

    pub async fn crear(&self, req: ReservaRequest, usuario_id: i64) -> AppResult<ReservaResponse> {
        if req.fecha_fin <= req.fecha_inicio {
            return Err(AppError::BadRequest(
                "La fecha de fin debe ser posterior a la de inicio".into(),
            ));
        }

        if self
            .repo
            .existe_conflicto(req.espacio_id, req.fecha_inicio, req.fecha_fin)
            .await?
        {
            return Err(AppError::Conflict(
                "El espacio ya tiene una reserva en ese horario".into(),
            ));
        }

        let prioridad = req.prioridad.unwrap_or(2);
        let nueva = NuevaReserva {
            usuario_id,
            espacio_id: req.espacio_id,
            nombre_espacio: req.nombre_espacio,
            fecha_inicio: req.fecha_inicio,
            fecha_fin: req.fecha_fin,
            prioridad,
            notas: req.notas,
        };

        let guardada = self.repo.insert(&nueva).await?;

        self.cola
            .lock()
            .map_err(|_| AppError::internal("cola de prioridad bloqueada"))?
            .insertar(guardada.clone());

        Ok(ReservaResponse::from_reserva(&guardada))
    }

    pub async fn confirmar_siguiente(&self) -> AppResult<ReservaResponse> {
        let mut reserva = self
            .cola
            .lock()
            .map_err(|_| AppError::internal("cola de prioridad bloqueada"))?
            .extraer_max()
            .ok_or_else(|| {
                AppError::NotFound("No hay reservas pendientes en la cola".into())
            })?;

        let actualizada = self
            .repo
            .update_estado(reserva.id, EstadoReserva::Confirmada)
            .await?;
        reserva = actualizada;

        Ok(ReservaResponse::from_reserva(&reserva))
    }

    pub fn estado_cola(&self) -> AppResult<ColaEstadoResponse> {
        let cola = self
            .cola
            .lock()
            .map_err(|_| AppError::internal("cola de prioridad bloqueada"))?;

        Ok(ColaEstadoResponse {
            total_en_cola: cola.tamanio(),
            siguiente: cola.ver_siguiente().map(ReservaResponse::from_reserva),
            reservas: cola.ver_cola().iter().map(ReservaResponse::from_reserva).collect(),
        })
    }

    pub async fn mis_reservas(&self, usuario_id: i64) -> AppResult<Vec<ReservaResponse>> {
        let reservas = self.repo.find_by_usuario_id(usuario_id).await?;
        Ok(reservas
            .iter()
            .map(ReservaResponse::from_reserva)
            .collect())
    }

    pub async fn cancelar(
        &self,
        id: i64,
        usuario_id: i64,
        es_admin: bool,
    ) -> AppResult<ReservaResponse> {
        let reserva = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound("Reserva no encontrada".into()))?;

        if !es_admin && reserva.usuario_id != usuario_id {
            return Err(AppError::Forbidden(
                "Solo puedes cancelar tus propias reservas".into(),
            ));
        }

        let actualizada = self
            .repo
            .update_estado(id, EstadoReserva::Cancelada)
            .await?;

        Ok(ReservaResponse::from_reserva(&actualizada))
    }

    pub async fn listar_todas(&self) -> AppResult<Vec<ReservaResponse>> {
        let reservas = self.repo.find_all().await?;
        Ok(reservas
            .iter()
            .map(ReservaResponse::from_reserva)
            .collect())
    }
}
