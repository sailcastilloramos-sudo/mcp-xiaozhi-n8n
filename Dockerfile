# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instala dependencias del sistema (mínimas necesarias)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia TODOS los archivos necesarios
COPY . .

# Instala dependencias de Python (httpx YA está en requirements.txt)
RUN pip install --no-cache-dir -r requirements.txt

# Variable de entorno para XiaoZhi AI (sin token - se inyectará en runtime)
ENV MCP_ENDPOINT=""

# Comando para ejecutar el servidor MCP
CMD ["python", "mcp_pipe.py"]
