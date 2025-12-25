# n8n_webhook.py
import httpx
import asyncio
from typing import Any, Dict
from mcp import FastMCP

# Inicializa el cliente MCP
mcp = FastMCP("N8N-Webhook-Bridge")

@mcp.tool()
async def trigger_n8n_workflow(action_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Envía datos al webhook de N8N para activar un flujo de trabajo.
    
    Args:
        action_data: Un diccionario con la información que necesita procesar N8N.
                     Ejemplo: {"action": "start", "target": "campaign_123", "parameters": {}}
    
    Returns:
        Dict con la respuesta de N8N o un mensaje de error.
    """
    n8n_webhook_url = "https://ser2n8n.grupohsm.net/webhook-test/xiaozhi-action"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                n8n_webhook_url,
                json=action_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status": response.status_code,
                    "response": response.json() if response.text else "Webhook activado correctamente"
                }
            else:
                return {
                    "success": False,
                    "status": response.status_code,
                    "error": f"N8N respondió con error: {response.text}"
                }
    except Exception as e:
        return {
            "success": False,
            "error": f"Fallo al conectar con N8N: {str(e)}"
        }

if __name__ == "__main__":
    # Ejecuta el servidor MCP
    mcp.run(transport="stdio")
