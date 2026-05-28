use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub secret_key: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
            "postgres://postgres:postgres@localhost:5432/coworking_db".to_string()
        });
        let secret_key = env::var("SECRET_KEY").unwrap_or_else(|_| {
            "coworking_secret_key_change_me_in_prod".to_string()
        });
        let port = env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8003);

        Self {
            database_url,
            secret_key,
            port,
        }
    }
}
