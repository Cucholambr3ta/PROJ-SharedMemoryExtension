"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const supabase_js_1 = require("@supabase/supabase-js");
let heartbeatTimer;
let messageListenerTimer;
let lastMessageCheck = new Date().toISOString();
function activate(context) {
    console.log('La extensión "Shared Memory MCP" está activa.');
    // Iniciar servicios automáticos al activar
    startHeartbeat(context);
    startMessageListener(context);
    // Comando para configurar Supabase
    let setupSupabase = vscode.commands.registerCommand('shared-memory-mcp.setupSupabase', async () => {
        const url = await vscode.window.showInputBox({
            prompt: "Ingresa la URL de tu proyecto de Supabase (ej. https://xyz.supabase.co)",
            placeHolder: "https://your-project.supabase.co",
            ignoreFocusOut: true
        });
        if (!url)
            return;
        const key = await vscode.window.showInputBox({
            prompt: "Ingresa tu 'service_role' key de Supabase (Se guardará de forma segura)",
            password: true,
            ignoreFocusOut: true
        });
        if (!key)
            return;
        const defaultName = os.hostname() || "Agente-Desconocido";
        const machineId = await vscode.window.showInputBox({
            prompt: "Ingresa tu Nombre o Identificador (Ej. Dev-Olympia, PC-Casa). Esto se verá en la base de datos.",
            placeHolder: defaultName,
            value: defaultName,
            ignoreFocusOut: true
        });
        if (!machineId)
            return;
        // Guardar configuración global
        await vscode.workspace.getConfiguration('sharedMemoryMcp').update('supabaseUrl', url, vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('sharedMemoryMcp').update('machineId', machineId, vscode.ConfigurationTarget.Global);
        // Guardar Key en SecretStorage (encriptado por el OS)
        await context.secrets.store('supabaseServiceKey', key);
        vscode.window.showInformationMessage(`¡Configuración de Supabase guardada exitosamente para ${machineId}!`);
    });
    // Comando para copiar la ruta del servidor MCP al portapapeles
    let copyServerPath = vscode.commands.registerCommand('shared-memory-mcp.copyServerPath', async () => {
        const serverPath = path.join(context.extensionPath, 'dist', 'mcp-server', 'index.js');
        await vscode.env.clipboard.writeText(serverPath);
        vscode.window.showInformationMessage(`Ruta del servidor copiada: ${serverPath}. Pégala en la configuración de Roo Code o Cline.`);
    });
    // Comando para copiar la CONFIGURACIÓN MCP COMPLETA (con secretos)
    let copyMcpConfig = vscode.commands.registerCommand('shared-memory-mcp.copyMcpConfig', async () => {
        const url = vscode.workspace.getConfiguration('sharedMemoryMcp').get('supabaseUrl');
        const machineId = vscode.workspace.getConfiguration('sharedMemoryMcp').get('machineId');
        const key = await context.secrets.get('supabaseServiceKey');
        const serverPath = path.join(context.extensionPath, 'dist', 'mcp-server', 'index.js');
        if (!url || !key) {
            vscode.window.showErrorMessage('Primero configura tu Supabase usando el comando "Shared Memory: Configurar Supabase".');
            return;
        }
        const config = {
            "command": "node",
            "args": [serverPath],
            "env": {
                "SUPABASE_URL": url,
                "SUPABASE_SERVICE_KEY": key,
                "MACHINE_ID": machineId || "Agente-Anonimo"
            }
        };
        await vscode.env.clipboard.writeText(JSON.stringify({ "shared-memory-supabase": config }, null, 2));
        vscode.window.showInformationMessage('Configuración MCP completa (JSON) copiada. Pégala en tu archivo de configuración de Roo Code o Cline.');
    });
    // Comando para AUTO-CONFIGURAR MCP (Busca e inyecta)
    let autoConfigMcp = vscode.commands.registerCommand('shared-memory-mcp.autoConfigMcp', async () => {
        const url = vscode.workspace.getConfiguration('sharedMemoryMcp').get('supabaseUrl');
        const machineId = vscode.workspace.getConfiguration('sharedMemoryMcp').get('machineId');
        const key = await context.secrets.get('supabaseServiceKey');
        const serverPath = path.join(context.extensionPath, 'dist', 'mcp-server', 'index.js');
        if (!url || !key) {
            vscode.window.showErrorMessage('Primero configura tu Supabase usando el comando "Shared Memory: Configurar Supabase".');
            return;
        }
        const fs = require('fs-extra');
        const os = require('os');
        // Determinar posibles rutas del archivo de configuración (Antigravity y Roo Code)
        const homeDir = os.homedir();
        let configPaths = [];
        // 1. Antigravity (Linux/Mac)
        configPaths.push(path.join(homeDir, '.gemini', 'antigravity', 'mcp_config.json'));
        // 2. Roo Code / Cline
        if (process.platform === 'win32') {
            configPaths.push(path.join(process.env.APPDATA || '', 'Roaming', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'));
        }
        else if (process.platform === 'darwin') {
            configPaths.push(path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'));
        }
        else {
            configPaths.push(path.join(homeDir, '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json'));
        }
        let updatedFiles = 0;
        for (const configPath of configPaths) {
            try {
                if (await fs.pathExists(configPath)) {
                    let mcpConfig = await fs.readJson(configPath, { throws: false });
                    if (!mcpConfig)
                        mcpConfig = {};
                    if (!mcpConfig.mcpServers)
                        mcpConfig.mcpServers = {};
                    mcpConfig.mcpServers['shared-memory-supabase'] = {
                        "command": "node",
                        "args": [serverPath],
                        "env": {
                            "SUPABASE_URL": url,
                            "SUPABASE_SERVICE_KEY": key,
                            "MACHINE_ID": machineId || "Agente-Anonimo"
                        }
                    };
                    await fs.writeJson(configPath, mcpConfig, { spaces: 2 });
                    updatedFiles++;
                }
            }
            catch (error) {
                console.error(`Error actualizando ${configPath}`, error);
            }
        }
        if (updatedFiles > 0) {
            vscode.window.showInformationMessage(`¡Éxito! La configuración MCP se ha inyectado automáticamente en ${updatedFiles} cliente(s) (Antigravity/Roo).`);
        }
        else {
            vscode.window.showWarningMessage('No se encontraron archivos de configuración de Antigravity o Roo Code automáticamente. Usa el comando manual para copiar el JSON.');
        }
    });
    // Comando para generar el SQL de inicialización
    let generateSql = vscode.commands.registerCommand('shared-memory-mcp.generateSql', async () => {
        const sql = `-- 🧬 Esquema de Memoria Compartida OLYMP-IA (BYODB)

-- 1. Tabla de Conocimiento General (Memoria a largo plazo)
CREATE TABLE IF NOT EXISTS public.shared_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Tabla de Mensajería de Flota (Comunicación entre equipos/IAs)
CREATE TABLE IF NOT EXISTS public.fleet_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    sender_id TEXT NOT NULL,      -- Quién envía
    target_id TEXT,               -- Opcional: A quién va dirigido (null/ALL = Broadcast)
    level TEXT DEFAULT 'INFO',    -- INFO, ERROR, SOS, COMMAND
    content TEXT NOT NULL,        -- Mensaje o comando técnico
    status TEXT DEFAULT 'PENDING' -- PENDING, RESOLVED
);

-- 3. Tabla de Presencia (Fleet Nodes)
CREATE TABLE IF NOT EXISTS public.fleet_nodes (
    machine_id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'Activo',
    last_seen TIMESTAMPTZ DEFAULT now(),
    version TEXT
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_memories_content ON public.shared_memories USING GIN (to_tsvector('spanish', content));
CREATE INDEX IF NOT EXISTS idx_fleet_messages_target ON public.fleet_messages (target_id);
CREATE INDEX IF NOT EXISTS idx_fleet_messages_status ON public.fleet_messages (status);

-- 🔒 Seguridad de Datos (RLS)
-- Habilitamos RLS en todas las tablas expuestas en el esquema public.
-- Puesto que el MCP usa la service_role (que bypassa RLS), no necesitamos crear políticas
-- que permitan el acceso público (anon/authenticated). Esto previene fugas
-- de datos si la base de datos se expone por accidente en su API pública (PostgREST).
ALTER TABLE public.shared_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_nodes ENABLE ROW LEVEL SECURITY;
`;
        const doc = await vscode.workspace.openTextDocument({ content: sql, language: 'sql' });
        await vscode.window.showTextDocument(doc);
    });
    context.subscriptions.push(setupSupabase, copyServerPath, generateSql, copyMcpConfig);
}
// --- FUNCIONES DE SOPORTE (HEARTBEAT & MESSAGING) ---
async function getSupabaseClient(context) {
    const url = vscode.workspace.getConfiguration('sharedMemoryMcp').get('supabaseUrl');
    const key = await context.secrets.get('supabaseServiceKey');
    if (!url || !key)
        return null;
    return (0, supabase_js_1.createClient)(url, key);
}
function startHeartbeat(context) {
    if (heartbeatTimer)
        clearInterval(heartbeatTimer);
    const runHeartbeat = async () => {
        const supabase = await getSupabaseClient(context);
        if (!supabase)
            return;
        const config = vscode.workspace.getConfiguration('sharedMemoryMcp');
        const machineId = config.get('machineId');
        const status = config.get('status');
        await supabase.from('fleet_nodes').upsert({
            machine_id: machineId,
            status: status,
            last_seen: new Date().toISOString(),
            version: vscode.extensions.getExtension('Olympia.shared-memory-mcp')?.packageJSON.version || '1.0.0'
        });
    };
    const interval = (vscode.workspace.getConfiguration('sharedMemoryMcp').get('heartbeatInterval') || 60) * 1000;
    runHeartbeat(); // Ejecutar primero
    heartbeatTimer = setInterval(runHeartbeat, interval);
}
function startMessageListener(context) {
    if (messageListenerTimer)
        clearInterval(messageListenerTimer);
    const checkMessages = async () => {
        const config = vscode.workspace.getConfiguration('sharedMemoryMcp');
        if (!config.get('autoReadMessages'))
            return;
        const supabase = await getSupabaseClient(context);
        if (!supabase)
            return;
        const machineId = config.get('machineId');
        const { data, error } = await supabase
            .from('fleet_messages')
            .select('*')
            .or(`target_id.eq.${machineId},target_id.eq.ALL,target_id.is.null`)
            .gt('created_at', lastMessageCheck)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true });
        if (data && data.length > 0) {
            for (const msg of data) {
                vscode.window.showInformationMessage(`🛸 Flota [${msg.sender_id}]: ${msg.content}`);
            }
            lastMessageCheck = new Date().toISOString();
        }
    };
    // Polling cada 30 segundos para mensajes (balanceado)
    messageListenerTimer = setInterval(checkMessages, 30000);
}
function deactivate() {
    if (heartbeatTimer)
        clearInterval(heartbeatTimer);
    if (messageListenerTimer)
        clearInterval(messageListenerTimer);
}
//# sourceMappingURL=extension.js.map