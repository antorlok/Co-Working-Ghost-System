use axum::{
    extract::{FromRequestParts, Request, State},
    http::{header::AUTHORIZATION, request::Parts, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use serde::Deserialize;

use crate::error::AppError;
use crate::state::AppState;

/// Authenticated user extracted from Ghost JWT (`id` + `role` claims).
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub usuario_id: i64,
    pub role: String,
}

impl AuthUser {
    pub fn is_admin(&self) -> bool {
        self.role == "admin"
    }
}

#[derive(Debug, Deserialize)]
struct GhostClaims {
    #[serde(default, rename = "sub")]
    _sub: String,
    id: serde_json::Value,
    role: String,
}

impl GhostClaims {
    fn usuario_id(&self) -> Result<i64, AppError> {
        match &self.id {
            serde_json::Value::Number(n) => n
                .as_i64()
                .ok_or_else(|| AppError::Unauthorized("Token invalido o expirado".into())),
            serde_json::Value::String(s) => s
                .parse()
                .map_err(|_| AppError::Unauthorized("Token invalido o expirado".into())),
            _ => Err(AppError::Unauthorized("Token invalido o expirado".into())),
        }
    }
}

fn decode_token(secret_key: &str, token: &str) -> Result<AuthUser, AppError> {
    let key = DecodingKey::from_secret(secret_key.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;

    let token_data = decode::<GhostClaims>(token, &key, &validation)
        .map_err(|_| AppError::Unauthorized("Token invalido o expirado".into()))?;

    let claims = token_data.claims;
    Ok(AuthUser {
        usuario_id: claims.usuario_id()?,
        role: claims.role,
    })
}

/// Tower middleware: validates Bearer JWT (Ghost format) except on `/health`.
pub async fn jwt_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Response {
    if request.uri().path() == "/health" {
        return next.run(request).await;
    }

    let unauthorized = |msg: &str| {
        (
            StatusCode::UNAUTHORIZED,
            axum::Json(serde_json::json!({ "error": msg })),
        )
            .into_response()
    };

    let header = match request.headers().get(AUTHORIZATION).and_then(|h| h.to_str().ok()) {
        Some(h) if h.starts_with("Bearer ") => h,
        _ => return unauthorized("Token requerido"),
    };

    let token = &header[7..];
    match decode_token(&state.config.secret_key, token) {
        Ok(user) => {
            request.extensions_mut().insert(user);
            next.run(request).await
        }
        Err(AppError::Unauthorized(msg)) => unauthorized(&msg),
        Err(e) => e.into_response(),
    }
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<AuthUser>()
            .cloned()
            .ok_or_else(|| AppError::Unauthorized("Token requerido".into()))
    }
}
