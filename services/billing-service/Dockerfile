FROM node:20-alpine

WORKDIR /app

# Copiar el manifiesto de dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install --omit=dev && npm cache clean --force

# Copiar el código fuente
COPY . .

# Exponer el puerto por defecto
EXPOSE 8082

# Ejecutar el servicio
CMD ["node", "src/index.js"]
