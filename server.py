import os
import httpx
import json
from mcp import Server

# 1. Crear el servidor MCP que contendrá tus herramientas
server = Server("servidor-n8n-integration")

# 2. DEFINIR TU HERRAMIENTA PRINCIPAL PARA N8N
@server.tool()
def ejecutar_accion_n8n(accion: str, objetivo: str = "", valor: str = "") -> str:
    """
    Ejecuta una acción o automatización en el sistema n8n.
    Por ejemplo: encender luces, crear una tarea, consultar un estado.
    """
    # Obtiene la URL del webhook desde las variables de entorno
    webhook_url = os.getenv("N8N_WEBHOOK_URL")
    if not webhook_url:
        return "❌ Error: No está configurada la URL de n8n (N8N_WEBHOOK_URL)."

    # Prepara el payload que enviará a n8n
    payload = {
        "comando": accion,
        "objetivo": objetivo,
        "valor": valor,
        "timestamp": __import__("datetime").datetime.now().isoformat(),
        "origen": "xiaozhi_ai_mcp"
    }

    try:
        # Realiza la petición HTTP POST a tu webhook de n8n
        response = httpx.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30.0
        )
        response.raise_for_status()  # Lanza un error si la respuesta HTTP no es exitosa (2xx)

        # Intenta leer la respuesta como JSON, si es posible
        try:
            result_data = response.json()
            result_msg = json.dumps(result_data, ensure_ascii=False)
        except:
            result_msg = response.text

        return f"✅ Comando '{accion}' enviado a n8n. Respuesta: {result_msg}"

    except httpx.RequestError as e:
        return f"❌ Error de conexión con n8n: {str(e)}"
    except httpx.HTTPStatusError as e:
        return f"❌ Error HTTP {e.response.status_code} desde n8n: {e.response.text}"
    except Exception as e:
        return f"❌ Error inesperado: {str(e)}"

# 3. Puedes agregar más herramientas aquí si las necesitas en el futuro
# @server.tool()
# def otra_herramienta(parametro: str) -> str:
#     return f"Hiciste: {parametro}"

# 4. Punto de entrada del servidor. ¡NO CAMBIAR ESTO!
if __name__ == "__main__":
    # Inicia el servidor en modo STDIO. El 'mcp_pipe.py' se comunicará así con este script.
    server.run(transport="stdio")