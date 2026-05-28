# --- Fase de Compilación ---
FROM golang:1.23-alpine AS builder


# Instalar dependencias necesarias para compilar y descargar certificados SSL
RUN apk update && apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copiar definiciones de dependencias
COPY go.mod ./
# Descargar dependencias
RUN go mod download

# Copiar el código fuente de la aplicación
COPY . .

# Compilar un binario estático y optimizado
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o space-service cmd/main.go

# --- Fase de Producción Ligera ---
FROM alpine:3.18

# Instalar certificados CA para permitir llamadas HTTPS salientes si fueran necesarias
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copiar el binario compilado desde la fase anterior
COPY --from=builder /app/space-service .

# Exponer el puerto por defecto de ejecución
EXPOSE 8081

# Ejecutar el microservicio
CMD ["./space-service"]
