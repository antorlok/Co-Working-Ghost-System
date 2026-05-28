package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTAuthMiddleware intercepta y valida la presencia de un JWT firmado de forma válida en los headers
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Se requiere token de autenticación (Authorization header vacío)"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "El formato del header de autorización debe ser 'Bearer <token>'"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		secretKey := os.Getenv("SECRET_KEY")
		if secretKey == "" {
			secretKey = "coworking_secret_key_change_me_in_prod" // Default para coincidir con el microservicio de usuarios
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("método de firma no esperado: %v", token.Header["alg"])
			}
			return []byte(secretKey), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido o expirado"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No se pudieron parsear los claims del token"})
			c.Abort()
			return
		}

		// Extraer claims
		userEmail, _ := claims["sub"].(string)
		userIDFloat, _ := claims["id"].(float64)
		userRole, _ := claims["role"].(string)

		// Guardar en el contexto para uso de otros middlewares o handlers
		c.Set("user_email", userEmail)
		c.Set("user_id", uint(userIDFloat))
		c.Set("user_role", userRole)

		c.Next()
	}
}

// RoleRequired restringe el acceso a ciertos roles específicos
func RoleRequired(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Falta información de autenticación"})
			c.Abort()
			return
		}

		role, ok := roleVal.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Rol de usuario con formato inválido"})
			c.Abort()
			return
		}

		roleAllowed := false
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				roleAllowed = true
				break
			}
		}

		if !roleAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "No tienes permisos suficientes para realizar esta acción"})
			c.Abort()
			return
		}

		c.Next()
	}
}
