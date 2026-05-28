CREATE TABLE IF NOT EXISTS reservas (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    espacio_id BIGINT NOT NULL,
    nombre_espacio VARCHAR(255),
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    prioridad INT NOT NULL DEFAULT 2,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_reservas_conflicto ON reservas (espacio_id, fecha_inicio, fecha_fin)
    WHERE estado IN ('PENDIENTE', 'CONFIRMADA');
