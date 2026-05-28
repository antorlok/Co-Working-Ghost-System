use chrono::{DateTime, Utc};
use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct ReservaRequest {
    #[validate(range(min = 1))]
    pub espacio_id: i64,
    pub nombre_espacio: Option<String>,
    #[validate(custom(function = "validate_future"))]
    pub fecha_inicio: DateTime<Utc>,
    pub fecha_fin: DateTime<Utc>,
    #[validate(range(min = 1, max = 3))]
    pub prioridad: Option<i32>,
    pub notas: Option<String>,
}

fn validate_future(fecha: &DateTime<Utc>) -> Result<(), validator::ValidationError> {
    if *fecha <= Utc::now() {
        return Err(validator::ValidationError::new("future"));
    }
    Ok(())
}
