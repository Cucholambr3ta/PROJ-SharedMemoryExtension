# Shared Memory MCP (Supabase BYODB) 🛸

Extensión de VS Code que permite a agentes de IA (Roo Code, Cline, Cursor) compartir memoria persistente y comunicarse entre equipos utilizando el protocolo **MCP** y tu propia instancia de **Supabase** (Modelo BYODB - Bring Your Own Database).

## 🚀 Guía de Instalación para Beta Testers

Para instalar la extensión durante esta fase beta, sigue estos pasos:

1.  **Descargar el instalador**: Obtén el archivo `shared-memory-mcp-1.0.0.vsix` del repositorio o de la carpeta del proyecto.
2.  **Instalar en VS Code**:
    *   Abre VS Code.
    *   Ve a la vista de **Extensiones** (`Ctrl+Shift+X`).
    *   Haz clic en los **tres puntos (`...`)** en la parte superior derecha del panel.
    *   Selecciona **"Install from VSIX..."**.
    *   Elige el archivo `.vsix` descargado.
3.  **Reiniciar**: Se recomienda reiniciar VS Code tras la instalación.

## Configuración Paso a Paso

### 1. Preparar Supabase
1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. En VS Code, ejecuta el comando `Shared Memory: Generar SQL de inicialización`.
3. Copia el SQL generado y ejecútalo en el **SQL Editor** de tu dashboard de Supabase.

### 2. Configurar la Extensión
1. Ejecuta el comando `Shared Memory: Configurar Supabase`.
2. Ingresa la URL de tu proyecto y tu `service_role` key (segura).
3. Ajusta tu **Machine ID** (ej. "Laptop-Olympia") y tu **Status** en los ajustes de VS Code.

### 3. Conectar tu IA (Roo Code / Cline)
1. Ejecuta el comando `Shared Memory: Copiar configuración MCP para Roo/Cline`.
2. Pega el JSON resultante en tu archivo de configuración de MCP (ej. `roo_code_custom_settings.json`).

## Características principales
- **Privacidad Total**: No hay servidores intermedios. Tu IA se conecta directamente a TU base de datos.
- **Seguridad**: Las llaves de API se almacenan de forma segura en el llavero de tu sistema operativo (SecretStorage).
- **Multimáquina/Equipo**: Comparte el contexto entre diferentes computadoras de la flota.
- **Sistema de Presencia (Heartbeat)**: Visualiza quién está online y su estado actual.
- **Mensajería de Flota**: Envía alertas, comandos o mensajes a usuarios específicos (`target_id`) o a todo el equipo (`ALL`).
- **Notificaciones Nativas**: Recibe alertas en VS Code cuando otros miembros de la flota te envíen mensajes.

## Herramientas MCP Incluidas
- `save_memory`: Guarda datos importantes que la IA recordará en el futuro.
- `search_memory`: Busca en el historial de conocimientos compartidos.
- `list_fleet_nodes`: Lista todos los participantes de la flota, su estado y si están online.
- `send_fleet_message`: Envía mensajes directos o globales (`target_id: "ALL"`).
- `read_fleet_messages`: Consulta los mensajes dirigidos a tu ID o globales.

## Configuraciones Avanzadas
- **Heartbeat Interval**: Frecuencia (en segundos) con la que VS Code actualiza tu presencia.
- **Auto Read Messages**: Habilita notificaciones automáticas para mensajes entrantes.
- **Retention Days**: Días de historial de mensajes a conservar en la base de datos.

---

Desarrollado por [OLYMP-IA](https://olymp-ia.cl) · Supremacía Digital
