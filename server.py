import asyncio
from fastmcp import FastMCP
import httpx

# 1. INICIALIZAR EL SERVIDOR FASTMCP
# El nombre debe coincidir con el que configuraste en Xiaozhi
mcp = FastMCP("mi-servidor-n8n")

# 2. DECLARAR TU HERRAMIENTA (Se llamará 'ejecutar_accion_n8n')
@mcp.tool()
def ejecutar_accion_n8n(accion: str, objetivo: str = "", valor: str = "") -> str:
    """
    Ejecuta una acción o automatización en el sistema n8n.
    Puede controlar luces, tareas, datos, etc.

    Args:
        accion: Nombre de la acción (ej: 'encender_luces', 'crear_tarea').
        objetivo: Objetivo de la acción (ej: 'salon', 'comprar leche').
        valor: Valor opcional (ej: '22', 'alta').
    """
    # 3. LOGICA PARA LLAMAR A TU WEBHOOK DE N8N
    # IMPORTANTE: Reemplaza esta URL por la tuya
    webhook_url = "https://ser2n8n.grupohsm.net/webhook/xiaozhi-action"
    
    payload = {
        "comando": accion,
        "objetivo": objetivo,
        "valor": valor,
        "origen": "xiaozhi_ai_mcp_python"
    }
    
    try:
        # Hacer la petición HTTP a n8n
        response = httpx.post(webhook_url, json=payload, timeout=10.0)
        response.raise_for_status()  # Lanza error si HTTP no es 2xx
        return f"✅ Acción '{accion}' enviada a n8n. Respuesta: {response.text}"
    except Exception as e:
        return f"❌ Error al contactar a n8n: {str(e)}"

# 4. INICIAR EL SERVIDOR - VERSIÓN MÁS COMÚN
if __name__ == "__main__":
    import os
    token = os.getenv("XIAOZHI_MCP_TOKEN")
    if not token:
        raise ValueError("❌ Falta la variable de entorno XIAOZHI_MCP_TOKEN")
    
    # Construye la URL de conexión completa
    endpoint_url = f"wss://api.xiaozhi.me/mcp/?token={token}"
    print(f"🔗 Conectando a: {endpoint_url[:60]}...")
    
    # Intenta conectar usando el método 'run' con la URL
    mcp.run(server_url=endpoint_url)  # También prueba con 'url=' en lugar de 'server_url='
