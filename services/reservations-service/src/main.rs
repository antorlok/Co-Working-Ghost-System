mod algorithm;
mod auth;
mod config;
mod dto;
mod error;
mod models;
mod repository;
mod routes;
mod service;
mod state;

use std::net::SocketAddr;

use axum::{middleware, Router};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::auth::jwt::jwt_middleware;
use crate::config::Config;
use crate::state::AppState;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "reservations_service=debug,tower_http=debug,sqlx=warn".into()
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();

    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&db).await?;

    let state = AppState::new(config.clone(), db);
    state.reserva_service.inicializar_cola().await?;

    let app = Router::new()
        .merge(routes::router())
        .layer(middleware::from_fn_with_state(
            state.clone(),
            jwt_middleware,
        ))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!(%addr, "reservations-service listening");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
