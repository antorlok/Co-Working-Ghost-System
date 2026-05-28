use axum::{routing::get, Json, Router};
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub servicio: &'static str,
    pub estado: &'static str,
    pub puerto: String,
}

pub fn router() -> Router<AppState> {
    Router::new().route("/health", get(health))
}

async fn health(axum::extract::State(state): axum::extract::State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        servicio: "reservation-service",
        estado: "funcionando",
        puerto: state.config.port.to_string(),
    })
}
