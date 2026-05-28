package models

import (
	"time"

	"gorm.io/gorm"
)

// Espacio representa el modelo de datos para un espacio físico de coworking en la base de datos
type Espacio struct {
	ID             uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Nombre         string         `gorm:"type:varchar(100);not null;unique" json:"nombre"`
	Descripcion    string         `gorm:"type:text" json:"descripcion"`
	Capacidad      int            `gorm:"not null" json:"capacidad"`
	PrecioPorHora  float64        `gorm:"type:decimal(10,2);not null" json:"precio_por_hora"`
	Disponibilidad bool           `gorm:"default:true" json:"disponibilidad"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"` // Habilita Soft Delete en GORM
}

// TableName especifica el nombre de la tabla en inglés para coincidir con la base de datos compartida
func (Espacio) TableName() string {
	return "spaces"
}

// EspacioRequest define el formato de entrada de datos JSON al crear o actualizar un espacio
type EspacioRequest struct {
	Nombre         string  `json:"nombre" binding:"required"`
	Descripcion    string  `json:"descripcion"`
	Capacidad      int     `json:"capacidad" binding:"required,gt=0"`
	PrecioPorHora  float64 `json:"precio_por_hora" binding:"required,gt=0"`
	Disponibilidad *bool   `json:"disponibilidad"`
}
