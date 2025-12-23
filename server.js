import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import fetch from 'node-fetch';

// ============================================
// CONFIGURACIÓN (SE OBTIENE DE VARIABLES DE ENTORNO)
// ============================================
// ESTAS VARIABLES DEBES CONFIGURARLAS EN EL PANEL DE EASYPANEL
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL; // URL de tu webhook de n8n
const XIAOZHI_MCP_TOKEN = process.env.XIAOZHI_MCP_TOKEN; // Token de tu endpoint MCP
const XIAOZHI_MCP_ENDPOINT = process.env.XIAOZHI_MCP_ENDPOINT || 'wss://api.xiaozhi.me/mcp/';

// Validación crítica de configuración al inicio
if (!N8N_WEBHOOK_URL || !XIAOZHI_MCP_TOKEN) {
    console.error('❌ ERROR DE CONFIGURACIÓN: Faltan variables de entorno obligatorias.');
    console.error('   Asegúrate de configurar N8N_WEBHOOK_URL y XIAOZHI_MCP_TOKEN en Easypanel.');
    process.exit(1); // Detiene la ejecución si falta algo esencial
}

console.log('⚙️  Configuración cargada. Iniciando servidor MCP...');
console.log('🔗 Destino n8n:', N8N_WEBHOOK_URL);

// ============================================
// 1. CREAR EL SERVIDOR MCP
// ============================================
const server = new Server(
    { name: 'n8n-mcp-bridge', version: '1.0.0' },
    { capabilities: {} }
);

// ============================================
// 2. DECLARAR LAS HERRAMIENTAS DISPONIBLES
// ============================================
server.setRequestHandler('tools/list', async () => {
    return {
        tools: [
            {
                name: 'ejecutar_accion_n8n',
                description: 'Ejecuta una acción o automatización en el sistema n8n. Puede controlar luces, tareas, datos, etc.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        accion: {
                            type: 'string',
                            description: 'Nombre de la acción a realizar. Ej: "encender_luces", "crear_tarea", "consultar_estado"'
                        },
                        objetivo: {
                            type: 'string',
                            description: 'Objetivo de la acción. Ej: "salon", "comprar leche", "temperatura"'
                        },
                        valor: {
                            type: 'string',
                            description: 'Valor opcional. Ej: "22", "alta", "mañana"'
                        }
                    },
                    required: ['accion'] // Solo la acción es obligatoria
                }
            }
            // Puedes añadir más herramientas aquí en el futuro
        ]
    };
});

// ============================================
// 3. IMPLEMENTAR LA LÓGICA DE LAS HERRAMIENTAS
// ============================================
server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'ejecutar_accion_n8n') {
        const { accion, objetivo, valor } = args;

        console.log(`📨 Llamada a herramienta: ${accion} (Objetivo: ${objetivo}, Valor: ${valor})`);

        try {
            // Construir el payload para n8n
            const payload = {
                comando: accion,
                objetivo: objetivo || '',
                valor: valor || '',
                timestamp: new Date().toISOString(),
                origen: 'xiaozhi_ai_via_mcp'
            };

            // Llamar al webhook de n8n con un timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Xiaozhi-MCP-Server/1.0'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeout);

            const resultadoTexto = await response.text();
            console.log(`✅ n8n respondió (${response.status}): ${resultadoTexto.substring(0, 200)}...`);

            return {
                content: [{
                    type: 'text',
                    text: `Comando "${accion}" ejecutado en n8n. Respuesta del sistema: ${resultadoTexto}`
                }]
            };

        } catch (error) {
            console.error('❌ Error al llamar a n8n:', error.message);
            return {
                content: [{
                    type: 'text',
                    text: `Error al ejecutar la acción "${accion}" en n8n: ${error.message}`
                }],
                isError: true
            };
        }
    }

    throw new Error(`Herramienta no encontrada: ${name}`);
});

// ============================================
// 4. CONECTAR CON EL ENDPOINT MCP DE XIAOZHI AI
// ============================================
async function connectToXiaozhi() {
    try {
        console.log('🔄 Conectando al endpoint MCP de Xiaozhi AI...');
        
        const url = new URL(`${XIAOZHI_MCP_ENDPOINT}?token=${XIAOZHI_MCP_TOKEN}`);
        const transport = new WebSocketClientTransport(url);
        
        await server.connect(transport);
        console.log('✅ Conexión MCP establecida con Xiaozhi AI.');
        console.log('🎯 El asistente puede ahora usar la herramienta "ejecutar_accion_n8n".');

    } catch (error) {
        console.error('❌ Error fatal de conexión a Xiaozhi:', error.message);
        console.error('   Verifica: 1) El token MCP es correcto, 2) La red permite WebSockets, 3) El endpoint está activo.');
        process.exit(1); // Sale si no puede conectarse
    }
}

// ============================================
// 5. MANEJO DE SEÑALES PARA UN CIERRE LIMPIO
// ============================================
process.on('SIGTERM', () => {
    console.log('🛑 Señal SIGTERM recibida. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Señal SIGINT (Ctrl+C) recibida. Cerrando servidor...');
    process.exit(0);
});

// ============================================
// INICIAR TODO
// ============================================
connectToXiaozhi().catch(console.error);