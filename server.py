import os
import httpx
from fastmcp import FastMCP

# 1. INICIALIZAR EL SERVIDOR
mcp = FastMCP("mi-servidor-n8n")

# 2. DEFINIR LA HERRAMIENTA PARA N8N
@mcp.tool()
def ejecutar_accion_n8n(accion: str, objetivo: str = "", valor: str = "") -> str:
    """
    Ejecuta una acción en el sistema n8n. Ej: encender_luces, crear_tarea.
    """
    # URL de tu webhook - Asegúrate de que sea correcta
    webhook_url = os.getenv("N8N_WEBHOOK_URL", "https://ser2n8n.grupohsm.net/webhook/xiaozhi-action")
    
    payload = {
        "comando": accion,
        "objetivo": objetivo,
        "valor": valor,
        "origen": "xiaozhi_ai_mcp"
    }
    
    try:
        response = httpx.post(webhook_url, json=payload, timeout=10.0)
        response.raise_for_status()
        return f"✅ Acción '{accion}' completada. Respuesta: {response.text[:100]}"
    except httpx.RequestError as e:
        return f"❌ Error de conexión: {str(e)}"
    except Exception as e:
        return f"❌ Error: {str(e)}"

# 3. INICIAR EL SERVIDOR EN MODO STDIO
if __name__ == "__main__":
    # Este método permite que Xiaozhi AI se comunique con tu script
    print("🚀 Iniciando servidor MCP para Xiaozhi AI...")
    mcp.run()
