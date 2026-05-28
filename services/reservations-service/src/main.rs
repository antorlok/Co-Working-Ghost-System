use std::net::SocketAddr;

use sqlx::postgres::PgPoolOptions;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use reservations_service::build_app;
use reservations_service::config::Config;
use reservations_service::state::AppState;

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

    let app = build_app(state.clone());

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!(%addr, "reservations-service listening");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
