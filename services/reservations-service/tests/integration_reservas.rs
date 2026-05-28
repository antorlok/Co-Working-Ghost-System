mod common;

use axum::Router;
use common::{
    ghost_token, request, reserva_body_json, setup_app, try_connect_pool,
};

async fn test_app() -> Option<Router> {
    let pool = try_connect_pool().await?;
    Some(setup_app(pool).await)
}

#[tokio::test]
async fn health_es_publico_sin_token() {
    let Some(mut app) = test_app().await else {
        eprintln!(
            "SKIP: PostgreSQL unavailable (set DATABASE_URL or start postgres-db)"
        );
        return;
    };

    let (status, body) = request(&mut app, "GET", "/health", None, None).await;
    assert_eq!(status, 200);
    assert!(body.contains("reservation-service"));
    assert!(body.contains("funcionando"));
}

#[tokio::test]
async fn rutas_protegidas_requieren_token() {
    let Some(mut app) = test_app().await else {
        eprintln!("SKIP: PostgreSQL unavailable");
        return;
    };

    let (status, body) = request(&mut app, "GET", "/reservas/mis-reservas", None, None).await;
    assert_eq!(status, 401);
    assert!(body.contains("Token requerido"));
}

#[tokio::test]
async fn token_invalido_devuelve_401() {
    let Some(mut app) = test_app().await else {
        eprintln!("SKIP: PostgreSQL unavailable");
        return;
    };

    let (status, body) = request(
        &mut app,
        "GET",
        "/reservas/mis-reservas",
        Some("not-a-jwt"),
        None,
    )
    .await;
    assert_eq!(status, 401);
    assert!(body.contains("Token invalido") || body.contains("error"));
}

#[tokio::test]
async fn member_no_puede_acceder_rutas_admin() {
    let Some(mut app) = test_app().await else {
        eprintln!("SKIP: PostgreSQL unavailable");
        return;
    };

    let member = ghost_token(10, "member");

    let (status, body) = request(&mut app, "GET", "/reservas", Some(&member), None).await;
    assert_eq!(status, 403);
    assert!(body.contains("Solo administradores"));

    let (status, _) = request(&mut app, "GET", "/cola", Some(&member), None).await;
    assert_eq!(status, 403);

    let (status, _) = request(
        &mut app,
        "POST",
        "/cola/confirmar",
        Some(&member),
        None,
    )
    .await;
    assert_eq!(status, 403);
}

#[tokio::test]
async fn flujo_reserva_conflicto_cola_y_cancelacion() {
    let Some(mut app) = test_app().await else {
        eprintln!("SKIP: PostgreSQL unavailable");
        return;
    };

    let owner = ghost_token(1, "member");
    let other = ghost_token(2, "member");
    let admin = ghost_token(99, "admin");

    let body = reserva_body_json(7, 24, 1);
    let (status, created) = request(&mut app, "POST", "/reservas", Some(&owner), Some(body)).await;
    assert_eq!(status, 201, "create failed: {created}");
    let created_json: serde_json::Value = serde_json::from_str(&created).expect("json");
    let reserva_id = created_json["id"].as_i64().expect("id");
    assert_eq!(created_json["estado"], "PENDIENTE");
    assert_eq!(created_json["usuarioId"], 1);

    let conflict_body = reserva_body_json(7, 25, 2);
    let (status, conflict) =
        request(&mut app, "POST", "/reservas", Some(&owner), Some(conflict_body)).await;
    assert_eq!(status, 409, "expected conflict: {conflict}");
    assert!(conflict.contains("ya tiene una reserva"));

    let (status, mine) =
        request(&mut app, "GET", "/reservas/mis-reservas", Some(&owner), None).await;
    assert_eq!(status, 200);
    let mine_json: Vec<serde_json::Value> = serde_json::from_str(&mine).expect("json");
    assert_eq!(mine_json.len(), 1);
    assert_eq!(mine_json[0]["id"], reserva_id);

    let (status, cola) = request(&mut app, "GET", "/cola", Some(&admin), None).await;
    assert_eq!(status, 200);
    let cola_json: serde_json::Value = serde_json::from_str(&cola).expect("json");
    assert_eq!(cola_json["total_en_cola"], 1);
    assert_eq!(cola_json["siguiente"]["id"], reserva_id);

    let (status, forbidden) = request(
        &mut app,
        "DELETE",
        &format!("/reservas/{reserva_id}"),
        Some(&other),
        None,
    )
    .await;
    assert_eq!(status, 403, "cancel by non-owner: {forbidden}");
    assert!(forbidden.contains("Solo puedes cancelar"));

    let (status, confirmed) =
        request(&mut app, "POST", "/cola/confirmar", Some(&admin), None).await;
    assert_eq!(status, 200, "confirm failed: {confirmed}");
    let confirmed_json: serde_json::Value = serde_json::from_str(&confirmed).expect("json");
    assert_eq!(confirmed_json["id"], reserva_id);
    assert_eq!(confirmed_json["estado"], "CONFIRMADA");

    let (status, cancelled) = request(
        &mut app,
        "DELETE",
        &format!("/reservas/{reserva_id}"),
        Some(&owner),
        None,
    )
    .await;
    assert_eq!(status, 200, "owner cancel failed: {cancelled}");
    let cancelled_json: serde_json::Value = serde_json::from_str(&cancelled).expect("json");
    assert_eq!(cancelled_json["estado"], "CANCELADA");
}

#[tokio::test]
async fn admin_puede_listar_todas_las_reservas() {
    let Some(mut app) = test_app().await else {
        eprintln!("SKIP: PostgreSQL unavailable");
        return;
    };

    let member = ghost_token(5, "member");
    let admin = ghost_token(99, "admin");

    let body = reserva_body_json(3, 48, 2);
    let (status, _) = request(&mut app, "POST", "/reservas", Some(&member), Some(body)).await;
    assert_eq!(status, 201);

    let (status, all) = request(&mut app, "GET", "/reservas", Some(&admin), None).await;
    assert_eq!(status, 200);
    let all_json: Vec<serde_json::Value> = serde_json::from_str(&all).expect("json");
    assert!(!all_json.is_empty());
}
