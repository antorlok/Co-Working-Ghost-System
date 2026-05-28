package repository

import (
	"errors"

	"github.com/coworking/space-service/internal/models"
	"gorm.io/gorm"
)

// EspacioRepository maneja todas las consultas y escrituras en la tabla 'spaces' usando GORM
type EspacioRepository struct {
	db *gorm.DB
}

// NewEspacioRepository crea una nueva instancia del repositorio de espacios
func NewEspacioRepository(db *gorm.DB) *EspacioRepository {
	return &EspacioRepository{db: db}
}

// Crear inserta un nuevo espacio en la base de datos
func (r *EspacioRepository) Crear(req models.EspacioRequest) (*models.Espacio, error) {
	disponibilidad := true
	if req.Disponibilidad != nil {
		disponibilidad = *req.Disponibilidad
	}

	nuevoEspacio := models.Espacio{
		Nombre:         req.Nombre,
		Descripcion:    req.Descripcion,
		Capacidad:      req.Capacidad,
		PrecioPorHora:  req.PrecioPorHora,
		Disponibilidad: disponibilidad,
	}

	if err := r.db.Create(&nuevoEspacio).Error; err != nil {
		return nil, err
	}

	return &nuevoEspacio, nil
}

// ObtenerTodos lista todos los espacios con la posibilidad de aplicar filtros opcionales
func (r *EspacioRepository) ObtenerTodos(capacidadMin int, precioMax float64, soloDisponibles bool) ([]models.Espacio, error) {
	var espacios []models.Espacio
	query := r.db.Model(&models.Espacio{})

	if capacidadMin > 0 {
		query = query.Where("capacidad >= ?", capacidadMin)
	}

	if precioMax > 0 {
		query = query.Where("precio_por_hora <= ?", precioMax)
	}

	if soloDisponibles {
		query = query.Where("disponibilidad = ?", true)
	}

	if err := query.Find(&espacios).Error; err != nil {
		return nil, err
	}

	return espacios, nil
}

// ObtenerPorID obtiene un único espacio activo según su ID
func (r *EspacioRepository) ObtenerPorID(id uint) (*models.Espacio, error) {
	var espacio models.Espacio
	if err := r.db.First(&espacio, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // No se encontró
		}
		return nil, err
	}
	return &espacio, nil
}

// Actualizar modifica los campos de un espacio existente
func (r *EspacioRepository) Actualizar(id uint, req models.EspacioRequest) (*models.Espacio, error) {
	espacio, err := r.ObtenerPorID(id)
	if err != nil {
		return nil, err
	}
	if espacio == nil {
		return nil, nil // No se encontró
	}

	espacio.Nombre = req.Nombre
	espacio.Descripcion = req.Descripcion
	espacio.Capacidad = req.Capacidad
	espacio.PrecioPorHora = req.PrecioPorHora

	if req.Disponibilidad != nil {
		espacio.Disponibilidad = *req.Disponibilidad
	}

	if err := r.db.Save(espacio).Error; err != nil {
		return nil, err
	}

	return espacio, nil
}

// Eliminar realiza un soft-delete lógico de un espacio mediante su ID
func (r *EspacioRepository) Eliminar(id uint) error {
	var espacio models.Espacio
	if err := r.db.First(&espacio, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("espacio no encontrado")
		}
		return err
	}

	// GORM automáticamente realiza soft delete debido al campo DeletedAt en el struct
	if err := r.db.Delete(&espacio).Error; err != nil {
		return err
	}
	return nil
}
