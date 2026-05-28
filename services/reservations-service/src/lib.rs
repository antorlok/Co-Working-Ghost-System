pub mod algorithm;
pub mod auth;
pub mod config;
pub mod dto;
pub mod error;
pub mod models;
pub mod repository;
pub mod routes;
pub mod service;
pub mod state;

use axum::{middleware, Router};
use tower_http::cors::{Any, CorsLayer};

use crate::auth::jwt::jwt_middleware;
use crate::state::AppState;

/// Builds the HTTP router used by the binary and integration tests.
pub fn build_app(state: AppState) -> Router {
    Router::new()
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
        .with_state(state)
}
