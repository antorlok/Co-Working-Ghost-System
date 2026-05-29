package main

import (
	"log"
	"os"
	"strings"

	"github.com/coworking/space-service/internal/handlers"
	"github.com/coworking/space-service/internal/middleware"
	"github.com/coworking/space-service/internal/models"
	"github.com/coworking/space-service/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Intentar cargar variables desde un archivo .env local, si existe
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081" // Puerto por defecto para el space-service
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/coworking_db?sslmode=disable"
	}

	// Adaptar el formato de URL de SQLAlchemy (Python) a formato estándar de Go postgres
	if strings.HasPrefix(dbURL, "postgresql+psycopg2://") {
		dbURL = strings.Replace(dbURL, "postgresql+psycopg2://", "postgres://", 1)
	}

	log.Printf("Conectando a base de datos compartida...")
	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Error al conectar con la base de datos: %v", err)
	}

	// Ejecutar migraciones automáticas para crear o actualizar la tabla 'spaces'
	log.Printf("Ejecutando migraciones automáticas GORM para espacios...")
	if err := db.AutoMigrate(&models.Espacio{}); err != nil {
		log.Fatalf("Error al ejecutar migraciones en la base de datos: %v", err)
	}

	// Inicializar dependencias del dominio de Espacios
	espacioRepo := repository.NewEspacioRepository(db)
	espacioHandler := handlers.NewEspacioHandler(espacioRepo)

	// Configurar enrutador HTTP Gin
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// Habilitar CORS simple para desarrollo
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Agrupar rutas de la API v1 de espacios
	api := r.Group("/api/v1/spaces")
	{
		// Rutas públicas de consulta
		api.GET("", espacioHandler.ObtenerTodos)
		api.GET("/buscar", espacioHandler.Buscar)
		api.GET("/:id", espacioHandler.ObtenerPorID)

		// Rutas de administración protegidas por JWT y RBAC (Solo admin)
		adminRequired := api.Group("")
		adminRequired.Use(middleware.JWTAuthMiddleware())
		adminRequired.Use(middleware.RoleRequired("admin"))
		{
			adminRequired.POST("", espacioHandler.Crear)
			adminRequired.PUT("/:id", espacioHandler.Actualizar)
			adminRequired.DELETE("/:id", espacioHandler.Eliminar)
		}
	}

	log.Printf("Microservicio space-service corriendo en el puerto %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Error al iniciar el servidor HTTP: %v", err)
	}
}
