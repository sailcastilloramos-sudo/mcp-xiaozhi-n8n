# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instala dependencias del sistema si son necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia los requerimientos e instala dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Añade httpx a las dependencias
RUN pip install httpx

# Copia el código de la aplicación
COPY n8n_webhook.py .
COPY mcp_config.json .

# Variable para el endpoint de XiaoZhi AI (se pasa en runtime)
ENV MCP_ENDPOINT=wss://api.xiaozhi.me/mcp/

# Comando para ejecutar el pipe MCP
CMD ["python", "mcp_pipe.py"]