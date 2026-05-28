use std::sync::{Arc, Mutex};

use sqlx::PgPool;

use crate::algorithm::cola_prioridad::ColaPrioridad;
use crate::config::Config;
use crate::repository::reserva_repo::ReservaRepository;
use crate::service::reserva_service::ReservaService;

#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub reserva_service: ReservaService,
}

impl AppState {
    pub fn new(config: Config, db: PgPool) -> Self {
        let reservas = ReservaRepository::new(db);
        let cola = Arc::new(Mutex::new(ColaPrioridad::new()));
        let reserva_service = ReservaService::new(reservas, cola);
        Self {
            config,
            reserva_service,
        }
    }
}
