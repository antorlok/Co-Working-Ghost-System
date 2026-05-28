use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post},
    Json, Router,
};
use validator::Validate;

use crate::auth::AuthUser;
use crate::dto::request::ReservaRequest;
use crate::dto::response::{ColaEstadoResponse, ReservaResponse};
use crate::error::{AppError, AppResult};
use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/reservas", post(crear).get(listar_todas))
        .route("/reservas/mis-reservas", get(mis_reservas))
        .route("/reservas/{id}", delete(cancelar))
        .route("/cola", get(estado_cola))
        .route("/cola/confirmar", post(confirmar_siguiente))
}

fn require_admin(user: &AuthUser) -> AppResult<()> {
    if !user.is_admin() {
        return Err(AppError::Forbidden(
            "Solo administradores pueden realizar esta accion".into(),
        ));
    }
    Ok(())
}

fn validate_request(req: &ReservaRequest) -> AppResult<()> {
    req.validate().map_err(|errors| {
        let msg = errors
            .field_errors()
            .values()
            .flat_map(|v| v.iter())
            .filter_map(|e| e.message.as_ref())
            .map(|m| m.to_string())
            .next()
            .unwrap_or_else(|| "Datos de reserva invalidos".to_string());
        AppError::BadRequest(msg)
    })
}

async fn crear(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<ReservaRequest>,
) -> AppResult<(StatusCode, Json<ReservaResponse>)> {
    validate_request(&body)?;
    let reserva = state.reserva_service.crear(body, user.usuario_id).await?;
    Ok((StatusCode::CREATED, Json(reserva)))
}

async fn mis_reservas(
    State(state): State<AppState>,
    user: AuthUser,
) -> AppResult<Json<Vec<ReservaResponse>>> {
    let reservas = state.reserva_service.mis_reservas(user.usuario_id).await?;
    Ok(Json(reservas))
}

async fn cancelar(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<i64>,
) -> AppResult<Json<ReservaResponse>> {
    let reserva = state
        .reserva_service
        .cancelar(id, user.usuario_id, user.is_admin())
        .await?;
    Ok(Json(reserva))
}

async fn listar_todas(
    State(state): State<AppState>,
    user: AuthUser,
) -> AppResult<Json<Vec<ReservaResponse>>> {
    require_admin(&user)?;
    let reservas = state.reserva_service.listar_todas().await?;
    Ok(Json(reservas))
}

async fn estado_cola(
    State(state): State<AppState>,
    user: AuthUser,
) -> AppResult<Json<ColaEstadoResponse>> {
    require_admin(&user)?;
    let cola = state.reserva_service.estado_cola()?;
    Ok(Json(cola))
}

async fn confirmar_siguiente(
    State(state): State<AppState>,
    user: AuthUser,
) -> AppResult<Json<ReservaResponse>> {
    require_admin(&user)?;
    let reserva = state.reserva_service.confirmar_siguiente().await?;
    Ok(Json(reserva))
}
