# Usa una imagen oficial de Python
FROM python:3.11-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo de dependencias
COPY requirements.txt .

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el código de la aplicación al contenedor
COPY . .

# Comando para iniciar la aplicación: ejecuta el puente MCP
CMD ["python", "mcp_pipe.py"]