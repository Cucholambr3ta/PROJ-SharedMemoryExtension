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
const fs = __importStar(require("fs-extra"));
const supabase_js_1 = require("@supabase/supabase-js");
let heartbeatTimer;
let messageListenerTimer;
let lastMessageCheck = new Date().toISOString();
function activate(context) {
    console.log('La extensión "Shared Memory MCP" está activa.');
    // Iniciar servicios automáticos al activar
    startHeartbeat(context);
    startMessageListener(context);
    // Comando para configurar/crear un nuevo Perfil Supabase
    let setupSupabase = vscode.commands.registerCommand('shared-memory-mcp.setupSupabase', async () => {
        const profileName = await vscode.window.showInputBox({
            prompt: "Ingresa un Nombre para este Perfil de Base de Datos (ej. 'Flota-Principal', 'Proyecto-B')",
            placeHolder: "Flota-Principal",
            ignoreFocusOut: true
        });
        if (!profileName)
            return;
        const url = await vscode.window.showInputBox({
            prompt: "Ingresa la URL de tu proyecto de Supabase (ej. https://xyz.supabase.co)",
            placeHolder: "https://your-project.supabase.co",
            ignoreFocusOut: true
        });
        if (!url)
            return;
        const key = await vscode.window.showInputBox({
            prompt: "Ingresa tu 'service_role' key de Supabase (Se guardará de forma secreta para este perfil)",
            password: true,
            ignoreFocusOut: true
        });
        if (!key)
            return;
        const defaultName = os.hostname() || "Agente-Desconocido";
        const machineId = await vscode.window.showInputBox({
            prompt: "Ingresa tu Nombre o Identificador para ESTA flota (Ej. Dev-Olympia).",
            placeHolder: defaultName,
            value: defaultName,
            ignoreFocusOut: true
        });
        if (!machineId)
            return;
        // Recuperar y actualizar lista de perfiles
        let profiles = context.globalState.get('profiles', []);
        profiles = profiles.filter(p => p.name !== profileName);
        profiles.push({ name: profileName, url, machineId });
        await context.globalState.update('profiles', profiles);
        await context.globalState.update('activeProfile', profileName);
        // Guardar Key en SecretStorage prefijado por el nombre del perfil (con fallback iterativo a globalState en sistemas GNU/Linux sin anillo criptográfico)
        try {
            await context.secrets.store(`supabaseServiceKey_${profileName}`, key);
        }
        catch (error) {
            console.warn("SecretStorage falló, guardando en globalState", error);
            await context.globalState.update(`fallback_key_${profileName}`, key);
        }
        // Además, actualizamos la vieja config global por retrocompatibilidad/visualización sencilla si es necesario.
        await vscode.workspace.getConfiguration('sharedMemoryMcp').update('supabaseUrl', url, vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('sharedMemoryMcp').update('machineId', machineId, vscode.ConfigurationTarget.Global);
        // Reiniciar servicios con el nuevo perfil
        startHeartbeat(context);
        startMessageListener(context);
        await injectMcpConfig(context, url, key, machineId, profileName);
    });
    // Comando para CAMBIAR de perfil
    let switchProfile = vscode.commands.registerCommand('shared-memory-mcp.switchProfile', async () => {
        const profiles = context.globalState.get('profiles', []);
        if (profiles.length === 0) {
            vscode.window.showInformationMessage("No tienes perfiles configurados. Usa 'Shared Memory: Configurar Supabase' primero.");
            return;
        }
        const activeProfile = context.globalState.get('activeProfile', '');
        const items = profiles.map(p => ({
            label: p.name === activeProfile ? `$(check) ${p.name}` : p.name,
            description: p.url,
            profile: p
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: "Selecciona el Perfil (Flota de Agentes) a conectar",
            ignoreFocusOut: true
        });
        if (!selected)
            return;
        const prof = selected.profile;
        await context.globalState.update('activeProfile', prof.name);
        await vscode.workspace.getConfiguration('sharedMemoryMcp').update('supabaseUrl', prof.url, vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('sharedMemoryMcp').update('machineId', prof.machineId, vscode.ConfigurationTarget.Global);
        let key = await context.secrets.get(`supabaseServiceKey_${prof.name}`);
        if (!key) {
            key = context.globalState.get(`fallback_key_${prof.name}`);
        }
        if (!key) {
            vscode.window.showErrorMessage(`No se encontró el secreto guardado para el perfil ${prof.name}. configúralo de nuevo.`);
            return;
        }
        startHeartbeat(context);
        startMessageListener(context);
        await injectMcpConfig(context, prof.url, key, prof.machineId, prof.name);
    });
    // Comando para ELIMINAR un perfil
    let removeProfile = vscode.commands.registerCommand('shared-memory-mcp.removeProfile', async () => {
        const profiles = context.globalState.get('profiles', []);
        if (profiles.length === 0) {
            vscode.window.showInformationMessage("No hay perfiles para eliminar.");
            return;
        }
        const items = profiles.map(p => p.name);
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: "Selecciona el Perfil que deseas ELIMINAR de forma permanente",
            ignoreFocusOut: true
        });
        if (!selected)
            return;
        const newProfiles = profiles.filter(p => p.name !== selected);
        await context.globalState.update('profiles', newProfiles);
        try {
            await context.secrets.delete(`supabaseServiceKey_${selected}`); // Limpiar secreto
        }
        catch (error) {
            // Ignorar error si SecretStorage no está disponible
        }
        await context.globalState.update(`fallback_key_${selected}`, undefined); // Limpiar fallback
        let activeProfile = context.globalState.get('activeProfile', '');
        if (activeProfile === selected) {
            await context.globalState.update('activeProfile', '');
            vscode.window.showWarningMessage(`Eliminaste el perfil activo: ${selected}. Por favor cambia a otro perfil.`);
        }
        else {
            vscode.window.showInformationMessage(`Perfil ${selected} eliminado.`);
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
ALTER TABLE public.shared_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_nodes ENABLE ROW LEVEL SECURITY;
`;
        const doc = await vscode.workspace.openTextDocument({ content: sql, language: 'sql' });
        await vscode.window.showTextDocument(doc);
    });
    context.subscriptions.push(setupSupabase, switchProfile, removeProfile, generateSql);
}
// --- FUNCION DE INYECCION CONSOLIDADA ---
async function injectMcpConfig(context, url, key, machineId, profileName) {
    const serverPath = path.join(context.extensionPath, 'dist', 'mcp-server', 'index.js');
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
        vscode.window.showInformationMessage(`¡Conectado! El esquema [${profileName}] fue inyectado correctamente en ${updatedFiles} cliente(s) (Antigravity/Roo)`);
    }
    else {
        vscode.window.showWarningMessage(`Perfil [${profileName}] guardado. No detectamos clientes MCP estándar, por lo que tú serás el único que se comunique con esta flota a través del panel normal.`);
    }
}
// --- FUNCIONES DE SOPORTE (HEARTBEAT & MESSAGING) ---
async function getSupabaseClient(context) {
    const activeProfileName = context.globalState.get('activeProfile', '');
    if (!activeProfileName)
        return null; // No profile active
    const profiles = context.globalState.get('profiles', []);
    const prof = profiles.find(p => p.name === activeProfileName);
    if (!prof)
        return null;
    let key = await context.secrets.get(`supabaseServiceKey_${prof.name}`);
    if (!key) {
        key = context.globalState.get(`fallback_key_${prof.name}`);
    }
    if (!prof.url || !key)
        return null;
    return (0, supabase_js_1.createClient)(prof.url, key);
}
function startHeartbeat(context) {
    if (heartbeatTimer)
        clearInterval(heartbeatTimer);
    const runHeartbeat = async () => {
        const supabase = await getSupabaseClient(context);
        if (!supabase)
            return;
        const activeProfileName = context.globalState.get('activeProfile', '');
        const profiles = context.globalState.get('profiles', []);
        const prof = profiles.find(p => p.name === activeProfileName);
        if (!prof)
            return;
        const machineId = prof.machineId;
        const status = vscode.workspace.getConfiguration('sharedMemoryMcp').get('status') || 'Activo';
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
        const activeProfileName = context.globalState.get('activeProfile', '');
        const profiles = context.globalState.get('profiles', []);
        const prof = profiles.find(p => p.name === activeProfileName);
        if (!prof)
            return;
        const machineId = prof.machineId;
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
    // Polling cada 30 segundos
    messageListenerTimer = setInterval(checkMessages, 30000);
}
function deactivate() {
    if (heartbeatTimer)
        clearInterval(heartbeatTimer);
    if (messageListenerTimer)
        clearInterval(messageListenerTimer);
}
//# sourceMappingURL=extension.js.map