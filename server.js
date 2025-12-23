import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import fetch from 'node-fetch';

// ============================================
// CONFIGURACIÓN
// ============================================
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const XIAOZHI_MCP_TOKEN = process.env.XIAOZHI_MCP_TOKEN;
const XIAOZHI_MCP_ENDPOINT = process.env.XIAOZHI_MCP_ENDPOINT || 'wss://api.xiaozhi.me/mcp/';

if (!N8N_WEBHOOK_URL || !XIAOZHI_MCP_TOKEN) {
    console.error('❌ ERROR: Faltan variables N8N_WEBHOOK_URL o XIAOZHI_MCP_TOKEN');
    process.exit(1);
}

console.log('⚙️ Configuración cargada. Iniciando servidor MCP...');
console.log('🔗 Destino n8n:', N8N_WEBHOOK_URL);

// ============================================
// 1. CREAR SERVIDOR MCP (CONFIGURACIÓN COMPATIBLE)
// ============================================
const server = new Server(
    {
        name: 'n8n-mcp-bridge',
        version: '1.0.0'
    },
    {
        capabilities: {
            tools: {}
        }
    }
);

// ============================================
// 2. MANEJADOR DE LISTA DE HERRAMIENTAS
// ============================================
server.setRequestHandler('tools/list', async () => {
    console.log('📋 Solicitada lista de herramientas');
    return {
        tools: [
            {
                name: 'ejecutar_accion_n8n',
                description: 'Ejecuta una acción o automatización en el sistema n8n',
                inputSchema: {
                    type: 'object',
                    properties: {
                        accion: {
                            type: 'string',
                            description: 'Nombre de la acción: "encender_luces", "crear_tarea", etc.'
                        },
                        objetivo: {
                            type: 'string',
                            description: 'Objetivo: "salon", "comprar leche", etc.'
                        },
                        valor: {
                            type: 'string', 
                            description: 'Valor opcional: "22", "alta", etc.'
                        }
                    },
                    required: ['accion']
                }
            }
        ]
    };
});

// ============================================
// 3. MANEJADOR DE LLAMADAS A HERRAMIENTAS
// ============================================
server.setRequestHandler('tools/call', async (request) => {
    try {
        const { name, arguments: args } = request.params;
        console.log(`📨 Llamada a herramienta: ${name}`, args);

        if (name === 'ejecutar_accion_n8n') {
            const { accion, objetivo, valor } = args;
            
            const payload = {
                comando: accion,
                objetivo: objetivo || '',
                valor: valor || '',
                timestamp: new Date().toISOString(),
                origen: 'xiaozhi_ai_mcp'
            };

            console.log(`🔄 Enviando a n8n: ${N8N_WEBHOOK_URL}`);
            
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                timeout: 10000
            });

            const result = await response.text();
            console.log(`✅ n8n respondió (${response.status}): ${result.substring(0, 100)}`);

            return {
                content: [{
                    type: 'text',
                    text: `Acción "${accion}" completada. Respuesta: ${result}`
                }]
            };
        }

        throw new Error(`Herramienta desconocida: ${name}`);
    } catch (error) {
        console.error('❌ Error en tools/call:', error);
        return {
            content: [{
                type: 'text',
                text: `Error: ${error.message}`
            }],
            isError: true
        };
    }
});

// ============================================
// 4. CONEXIÓN CON XIAOZHI AI
// ============================================
async function connectToXiaozhi() {
    try {
        console.log('🔄 Conectando a Xiaozhi AI MCP...');
        
        let token = XIAOZHI_MCP_TOKEN;
        // Limpiar token si incluye la URL completa
        if (token.includes('wss://')) {
            const urlObj = new URL(token);
            token = urlObj.searchParams.get('token') || token;
        }
        
        const url = new URL(`${XIAOZHI_MCP_ENDPOINT}?token=${token}`);
        const transport = new WebSocketClientTransport(url);
        
        await server.connect(transport);
        console.log('✅ Conexión MCP establecida con Xiaozhi AI');
        console.log('🚀 Servidor listo. Herramienta "ejecutar_accion_n8n" disponible.');
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        process.exit(1);
    }
}

// ============================================
// 5. MANEJO DE SEÑALES
// ============================================
process.on('SIGTERM', () => {
    console.log('🛑 Apagando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Interrupción por usuario');
    process.exit(0);
});

// ============================================
// INICIAR
// ============================================
connectToXiaozhi().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
