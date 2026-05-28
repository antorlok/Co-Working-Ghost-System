use chrono::{DateTime, Utc};
use serde::Serialize;

use crate::models::reserva::{EstadoReserva, Reserva};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReservaResponse {
    pub id: i64,
    pub usuario_id: i64,
    pub espacio_id: i64,
    pub nombre_espacio: Option<String>,
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: DateTime<Utc>,
    pub estado: EstadoReserva,
    pub prioridad: i32,
    pub prioridad_nombre: String,
    pub creado_en: DateTime<Utc>,
    pub notas: Option<String>,
    pub posicion_en_cola: Option<i32>,
}

impl ReservaResponse {
    pub fn from_reserva(reserva: &Reserva) -> Self {
        Self {
            id: reserva.id,
            usuario_id: reserva.usuario_id,
            espacio_id: reserva.espacio_id,
            nombre_espacio: reserva.nombre_espacio.clone(),
            fecha_inicio: reserva.fecha_inicio,
            fecha_fin: reserva.fecha_fin,
            estado: reserva.estado,
            prioridad: reserva.prioridad,
            prioridad_nombre: prioridad_nombre(reserva.prioridad),
            creado_en: reserva.creado_en,
            notas: reserva.notas.clone(),
            posicion_en_cola: None,
        }
    }
}

fn prioridad_nombre(prioridad: i32) -> String {
    match prioridad {
        1 => "URGENTE".to_string(),
        2 => "NORMAL".to_string(),
        3 => "FLEXIBLE".to_string(),
        _ => "NORMAL".to_string(),
    }
}

#[derive(Debug, Serialize)]
pub struct ColaEstadoResponse {
    pub total_en_cola: usize,
    pub siguiente: Option<ReservaResponse>,
    pub reservas: Vec<ReservaResponse>,
}
