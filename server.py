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

# 4. INICIAR EL SERVIDOR (Se conectará automáticamente al endpoint de Xiaozhi)
if __name__ == "__main__":
    # El servidor leerá automáticamente la variable de entorno
    # 'XIAOZHI_MCP_TOKEN' para autenticarse
    mcp.run(transport="websocket")