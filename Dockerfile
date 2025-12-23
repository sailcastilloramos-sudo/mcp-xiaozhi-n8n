# Usa una imagen oficial de Node.js ligera
FROM node:18-alpine

# Crea y define el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de definición de dependencias
COPY package*.json ./

# Instala las dependencias de producción de forma limpia y precisa
RUN npm ci --only=production

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto (por convención, aunque el MCP usa WebSocket)
EXPOSE 3000

# Define el comando para ejecutar la aplicación
CMD [ "node", "server.js" ]