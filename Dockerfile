# Dockerfile (en la raíz del proyecto)
FROM docker:latest

# Instalar Docker Compose dentro del contenedor
RUN apk add --no-cache docker-compose

# Crear carpeta de trabajo
WORKDIR /app

# Copiar todos los archivos del proyecto
COPY . .

# Comando que ejecutará docker-compose
CMD ["docker-compose", "up"]
