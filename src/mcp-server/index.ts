#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

// Leer de variables de entorno (pasadas por la extensión de VS Code)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const MACHINE_ID = process.env.MACHINE_ID || "Agente-Desconocido";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const server = new Server(
    {
        name: "shared-memory-mcp-byodb",
        version: "1.2.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Herramientas MCP
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "save_memory",
                description: "Guarda un fragmento de conocimiento o contexto en tu Supabase privado.",
                inputSchema: {
                    type: "object",
                    properties: {
                        content: { type: "string", description: "El conocimiento a recordar." },
                        category: { type: "string", description: "Categoría opcional (ej. 'frontend', 'backend', 'config')." }
                    },
                    required: ["content"]
                }
            },
            {
                name: "search_memory",
                description: "Busca en tus memorias guardadas en Supabase por palabras clave.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Término de búsqueda." }
                    },
                    required: ["query"]
                }
            },
            {
                name: "list_fleet_nodes",
                description: "Lista todos los usuarios/máquinas registrados en la flota, su estado y última conexión.",
                inputSchema: {
                    type: "object",
                    properties: {}
                }
            },
            {
                name: "send_fleet_message",
                description: "Envía un mensaje a otro usuario o a todos ('ALL').",
                inputSchema: {
                    type: "object",
                    properties: {
                        target_id: { type: "string", description: "ID de la máquina destino o 'ALL' para broadcast global." },
                        level: { type: "string", enum: ["INFO", "ERROR", "SOS", "COMMAND"], default: "INFO" },
                        content: { type: "string", description: "Contenido del mensaje." }
                    },
                    required: ["target_id", "content"]
                }
            },
            {
                name: "read_fleet_messages",
                description: "Lee mensajes dirigidos a esta máquina o globales.",
                inputSchema: {
                    type: "object",
                    properties: {
                        unread_only: { type: "boolean", default: true }
                    }
                }
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "save_memory") {
            const { content, category } = args as any;
            const { data, error } = await supabase
                .from('shared_memories')
                .insert([{ content, category: category || 'general' }])
                .select();

            if (error) throw error;
            return { content: [{ type: "text", text: `Memoria guardada exitosamente. ID: ${data[0].id}` }] };
        }

        if (name === "search_memory") {
            const { query } = args as any;
            const { data, error } = await supabase
                .from('shared_memories')
                .select('*')
                .ilike('content', `%${query}%`)
                .limit(5);

            if (error) throw error;
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        if (name === "list_fleet_nodes") {
            const { data, error } = await supabase
                .from('fleet_nodes')
                .select('*')
                .order('last_seen', { ascending: false });

            if (error) throw error;

            const now = new Date();
            const nodes = data.map(node => ({
                ...node,
                is_online: (now.getTime() - new Date(node.last_seen).getTime()) < 180000 // Online si visto en los últimos 3 min
            }));

            return { content: [{ type: "text", text: JSON.stringify(nodes, null, 2) }] };
        }

        if (name === "send_fleet_message") {
            const { target_id, level, content } = args as any;
            // Estandarizar 'ALL' como null o 'ALL' dependiendo de cómo lo maneje el receptor
            const target = (target_id?.toUpperCase() === 'ALL') ? 'ALL' : target_id;

            const { data, error } = await supabase
                .from('fleet_messages')
                .insert([{
                    sender_id: MACHINE_ID,
                    target_id: target,
                    level: level || 'INFO',
                    content
                }])
                .select();

            if (error) throw error;
            return { content: [{ type: "text", text: `Mensaje enviado a ${target} de parte de ${MACHINE_ID}.` }] };
        }

        if (name === "read_fleet_messages") {
            const { unread_only } = args as any;
            let queryBuilder = supabase.from('fleet_messages')
                .select('*')
                .or(`target_id.eq.${MACHINE_ID},target_id.eq.ALL,target_id.is.null`)
                .order('created_at', { ascending: false })
                .limit(10);

            if (unread_only) {
                queryBuilder = queryBuilder.eq('status', 'PENDING');
            }

            const { data, error } = await queryBuilder;
            if (error) throw error;
            return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        }

        throw new Error(`Tool not found: ${name}`);
    } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
