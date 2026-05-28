use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::error::{AppError, AppResult};
use crate::models::reserva::{EstadoReserva, NuevaReserva, Reserva};

#[derive(Clone)]
pub struct ReservaRepository {
    pool: PgPool,
}

impl ReservaRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub async fn insert(&self, nueva: &NuevaReserva) -> AppResult<Reserva> {
        sqlx::query_as::<_, Reserva>(
            r#"
            INSERT INTO reservas (
                usuario_id, espacio_id, nombre_espacio,
                fecha_inicio, fecha_fin, estado, prioridad, notas
            )
            VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', $6, $7)
            RETURNING
                id, usuario_id, espacio_id, nombre_espacio,
                fecha_inicio, fecha_fin, estado, prioridad, creado_en, notas
            "#,
        )
        .bind(nueva.usuario_id)
        .bind(nueva.espacio_id)
        .bind(&nueva.nombre_espacio)
        .bind(nueva.fecha_inicio)
        .bind(nueva.fecha_fin)
        .bind(nueva.prioridad)
        .bind(&nueva.notas)
        .fetch_one(&self.pool)
        .await
        .map_err(AppError::from)
    }

    pub async fn find_by_id(&self, id: i64) -> AppResult<Option<Reserva>> {
        sqlx::query_as::<_, Reserva>(
            r#"
            SELECT
                id, usuario_id, espacio_id, nombre_espacio,
                fecha_inicio, fecha_fin, estado, prioridad, creado_en, notas
            FROM reservas
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(AppError::from)
    }

    pub async fn find_all(&self) -> AppResult<Vec<Reserva>> {
        sqlx::query_as::<_, Reserva>(
            r#"
            SELECT
                id, usuario_id, espacio_id, nombre_espacio,
                fecha_inicio, fecha_fin, estado, prioridad, creado_en, notas
            FROM reservas
            ORDER BY creado_en DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(AppError::from)
    }

    pub async fn find_by_usuario_id(&self, usuario_id: i64) -> AppResult<Vec<Reserva>> {
        sqlx::query_as::<_, Reserva>(
            r#"
            SELECT
                id, usuario_id, espacio_id, nombre_espacio,
                fecha_inicio, fecha_fin, estado, prioridad, creado_en, notas
            FROM reservas
            WHERE usuario_id = $1
            ORDER BY creado_en DESC
            "#,
        )
        .bind(usuario_id)
        .fetch_all(&self.pool)
        .await
        .map_err(AppError::from)
    }

    pub async fn find_by_espacio_id(&self, espacio_id: i64) -> AppResult<Vec<Reserva>> {
        sqlx::query_as::<_, Reserva>(
            r#"
            SELECT
                id, usuario_id, espacio_id, nombre_espacio,
                fecha_inicio, fecha_fin, estado, prioridad, creado_en, notas
            FROM reservas
            WHERE espacio_id = $1
            ORDER BY fecha_inicio
            "#,
        )
        .bind(espacio_id)
        .fetch_all(&self.pool)
        .await
        .map_err(AppError::from)
    }

    pub async fn find_pendientes_ordered(&self) -> AppResult<Vec<Reserva>> {
        sqlx::query_as::<_, Reserva>(
            r#"
            SELECT
                id, usuario_id, espacio_id, nombre_espacio,
                fecha_inicio, fecha_fin, estado, prioridad, creado_en, notas
            FROM reservas
            WHERE estado = 'PENDIENTE'
            ORDER BY prioridad ASC, creado_en ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(AppError::from)
    }

    pub async fn existe_conflicto(
        &self,
        espacio_id: i64,
        inicio: DateTime<Utc>,
        fin: DateTime<Utc>,
    ) -> AppResult<bool> {
        let exists: bool = sqlx::query_scalar(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM reservas
                WHERE espacio_id = $1
                  AND estado IN ('PENDIENTE', 'CONFIRMADA')
                  AND fecha_inicio < $3
                  AND fecha_fin > $2
            )
            "#,
        )
        .bind(espacio_id)
        .bind(inicio)
        .bind(fin)
        .fetch_one(&self.pool)
        .await
        .map_err(AppError::from)?;

        Ok(exists)
    }

    pub async fn update_estado(&self, id: i64, estado: EstadoReserva) -> AppResult<Reserva> {
        sqlx::query_as::<_, Reserva>(
            r#"
            UPDATE reservas
            SET estado = $2
            WHERE id = $1
            RETURNING
                id, usuario_id, espacio_id, nombre_espacio,
                fecha_inicio, fecha_fin, estado, prioridad, creado_en, notas
            "#,
        )
        .bind(id)
        .bind(estado.as_str())
        .fetch_one(&self.pool)
        .await
        .map_err(AppError::from)
    }
}
