use std::time::{SystemTime, UNIX_EPOCH};

use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::Router;
use chrono::{Duration, Utc};
use http_body_util::BodyExt;
use jsonwebtoken::{encode, EncodingKey, Header};
use reservations_service::build_app;
use reservations_service::config::Config;
use reservations_service::state::AppState;
use serde::Serialize;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tower::ServiceExt;

const TEST_SECRET: &str = "coworking_secret_key_change_me_in_prod";

#[derive(Serialize)]
struct GhostTokenClaims {
    sub: String,
    id: i64,
    role: String,
    exp: u64,
}

pub fn test_database_url() -> String {
    std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgres@127.0.0.1:5432/coworking_db".to_string()
    })
}

pub async fn try_connect_pool() -> Option<PgPool> {
    let url = test_database_url();
    let pool = PgPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&url)
        .await
        .ok()?;
    sqlx::migrate!("./migrations").run(&pool).await.ok()?;
    Some(pool)
}

pub async fn setup_app(pool: PgPool) -> Router {
    sqlx::query("TRUNCATE TABLE reservas RESTART IDENTITY")
        .execute(&pool)
        .await
        .expect("truncate reservas");

    let config = Config {
        database_url: test_database_url(),
        secret_key: TEST_SECRET.to_string(),
        port: 8003,
    };
    let state = AppState::new(config, pool);
    state
        .reserva_service
        .inicializar_cola()
        .await
        .expect("initialize queue");
    build_app(state)
}

pub fn ghost_token(user_id: i64, role: &str) -> String {
    let exp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_secs()
        + 3600;

    let claims = GhostTokenClaims {
        sub: format!("user{user_id}@test.local"),
        id: user_id,
        role: role.to_string(),
        exp,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(TEST_SECRET.as_bytes()),
    )
    .expect("sign token")
}

pub fn future_slot(hours_from_now: i64) -> (chrono::DateTime<Utc>, chrono::DateTime<Utc>) {
    let start = Utc::now() + Duration::hours(hours_from_now);
    let end = start + Duration::hours(2);
    (start, end)
}

pub fn reserva_body_json(
    espacio_id: i64,
    hours_from_now: i64,
    prioridad: i32,
) -> String {
    let (inicio, fin) = future_slot(hours_from_now);
    serde_json::json!({
        "espacioId": espacio_id,
        "fechaInicio": inicio.to_rfc3339(),
        "fechaFin": fin.to_rfc3339(),
        "prioridad": prioridad,
    })
    .to_string()
}

pub async fn request(
    app: &mut Router,
    method: &str,
    uri: &str,
    token: Option<&str>,
    body: Option<String>,
) -> (StatusCode, String) {
    let mut builder = Request::builder().method(method).uri(uri);
    if let Some(token) = token {
        builder = builder.header("Authorization", format!("Bearer {token}"));
    }
    if body.is_some() {
        builder = builder.header("content-type", "application/json");
    }

    let request = builder
        .body(Body::from(body.unwrap_or_default()))
        .expect("valid request");

    let response = app.oneshot(request).await.expect("response");
    let status = response.status();
    let bytes = response
        .into_body()
        .collect()
        .await
        .expect("body")
        .to_bytes();
    let text = String::from_utf8_lossy(&bytes).into_owned();
    (status, text)
}
