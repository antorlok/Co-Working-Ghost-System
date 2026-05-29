package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/coworking/space-service/internal/models"
	"github.com/coworking/space-service/internal/repository"
	"github.com/coworking/space-service/pkg/algorithm"
	"github.com/gin-gonic/gin"
)

// EspacioHandler maneja las solicitudes HTTP entrantes de Gin-Gonic y se comunica con el repositorio
type EspacioHandler struct {
	repo *repository.EspacioRepository
}

// NewEspacioHandler instancia un nuevo controlador de espacios
func NewEspacioHandler(repo *repository.EspacioRepository) *EspacioHandler {
	return &EspacioHandler{repo: repo}
}

func parseEspacioID(idStr string) (uint, error) {
	id, err := strconv.ParseUint(idStr, 10, strconv.IntSize)
	if err != nil {
		return 0, err
	}

	return uint(id), nil
}

// Crear registra un espacio físico nuevo en la base de datos (Admin solamente)
func (h *EspacioHandler) Crear(c *gin.Context) {
	var req models.EspacioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Campos inválidos en la solicitud: " + err.Error()})
		return
	}

	espacio, err := h.repo.Crear(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error interno al registrar el espacio: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, espacio)
}

// ObtenerTodos lista los espacios activos aplicando filtros opcionales de query string
func (h *EspacioHandler) ObtenerTodos(c *gin.Context) {
	capacidadMin, _ := strconv.Atoi(c.Query("capacidad"))
	precioMax, _ := strconv.ParseFloat(c.Query("precio_max"), 64)
	soloDisponibles := c.Query("disponible") == "true"

	espacios, err := h.repo.ObtenerTodos(capacidadMin, precioMax, soloDisponibles)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar los espacios: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, espacios)
}

// ObtenerPorID obtiene un espacio según su ID y lo devuelve al cliente
func (h *EspacioHandler) ObtenerPorID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := parseEspacioID(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El ID proporcionado no es válido"})
		return
	}

	espacio, err := h.repo.ObtenerPorID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al buscar el espacio: " + err.Error()})
		return
	}

	if espacio == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "El espacio con el ID solicitado no existe"})
		return
	}

	c.JSON(http.StatusOK, espacio)
}

// Actualizar modifica la información de un espacio existente (Admin solamente)
func (h *EspacioHandler) Actualizar(c *gin.Context) {
	idStr := c.Param("id")
	id, err := parseEspacioID(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El ID proporcionado no es válido"})
		return
	}

	var req models.EspacioRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Campos inválidos en la solicitud: " + err.Error()})
		return
	}

	espacio, err := h.repo.Actualizar(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar el espacio: " + err.Error()})
		return
	}

	if espacio == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "El espacio con el ID solicitado no existe para actualizar"})
		return
	}

	c.JSON(http.StatusOK, espacio)
}

// Eliminar realiza un borrado lógico (soft delete) del espacio en base de datos (Admin solamente)
func (h *EspacioHandler) Eliminar(c *gin.Context) {
	idStr := c.Param("id")
	id, err := parseEspacioID(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El ID proporcionado no es válido"})
		return
	}

	err = h.repo.Eliminar(id)
	if err != nil {
		if err.Error() == "espacio no encontrado" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar el espacio: " + err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// Buscar realiza una búsqueda en memoria de espacios utilizando el algoritmo seleccionado (?algoritmo=lineal|binaria).
// También calcula el tiempo exacto que le toma a la búsqueda ejecutarse para comparar eficiencia.
func (h *EspacioHandler) Buscar(c *gin.Context) {
	query := c.Query("q")
	algoritmo := c.DefaultQuery("algoritmo", "binaria")

	// Obtenemos todos los espacios activos sin filtros específicos para buscar en el slice completo
	espacios, err := h.repo.ObtenerTodos(0, 0, false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al consultar los espacios para la búsqueda: " + err.Error()})
		return
	}

	var filtrados []models.Espacio
	inicio := time.Now()

	switch algoritmo {
	case "lineal":
		filtrados = algorithm.BusquedaLineal(espacios, query)
	case "binaria":
		filtrados = algorithm.BusquedaBinaria(espacios, query)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Algoritmo no válido. Use 'lineal' o 'binaria'"})
		return
	}

	duracion := time.Since(inicio)

	c.JSON(http.StatusOK, gin.H{
		"algoritmo":  algoritmo,
		"busqueda":   query,
		"tiempo_ns":  duracion.Nanoseconds(),
		"tiempo_ms":  float64(duracion.Nanoseconds()) / 1e6,
		"resultados": filtrados,
		"cantidad":   len(filtrados),
	})
}

