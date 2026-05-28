use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "varchar", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EstadoReserva {
    Pendiente,
    Confirmada,
    Cancelada,
    Completada,
}

impl EstadoReserva {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Pendiente => "PENDIENTE",
            Self::Confirmada => "CONFIRMADA",
            Self::Cancelada => "CANCELADA",
            Self::Completada => "COMPLETADA",
        }
    }
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Reserva {
    pub id: i64,
    pub usuario_id: i64,
    pub espacio_id: i64,
    pub nombre_espacio: Option<String>,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: DateTime<Utc>,
    pub estado: EstadoReserva,
    pub prioridad: i32,
    pub creado_en: DateTime<Utc>,
    pub notas: Option<String>,
}

#[derive(Debug, Clone)]
pub struct NuevaReserva {
    pub usuario_id: i64,
    pub espacio_id: i64,
    pub nombre_espacio: Option<String>,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: DateTime<Utc>,
    pub prioridad: i32,
    pub notas: Option<String>,
}
