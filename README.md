# Shared Memory MCP (Supabase BYODB) 🛸

Extensión de VS Code que permite a agentes de IA (Roo Code, Cline, Cursor) compartir memoria persistente y comunicarse entre equipos utilizando el protocolo **MCP** y tu propia instancia de **Supabase** (Modelo BYODB - Bring Your Own Database).

## 🚀 Guía de Instalación para Beta Testers

Para instalar la extensión durante esta fase beta en tu entorno (Visual Studio Code, Cursor o Antigravity), sigue estos pasos:

### Método A: Instalación por Visor (Antigravity / VS Code)
1.  **Descargar el instalador**: Obtén el archivo `shared-memory-mcp-1.0.0.vsix` del repositorio principal.
2.  **Instalar desde la UI**:
    *   Ve a la vista de **Extensiones**.
    *   Haz clic en los **tres puntos (`...`)** en la parte superior derecha del panel.
    *   Selecciona **"Install from VSIX..."** y elige el archivo descargado.

### Método B: Instalación por Terminal (Recomendado para Antigravity)
- Ejecuta el siguiente comando en tu terminal para instalarlo directamente:
  ```bash
  antigravity --install-extension /Ruta/Hacia/shared-memory-mcp-1.0.0.vsix
  ```

## Configuración Paso a Paso

### 1. Preparar Supabase
1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Abre la **Paleta de Comandos** en VS Code / Antigravity (`Ctrl+Shift+P` o `Cmd+Shift+P` en macOS).
3. Escribe y ejecuta el comando: `Shared Memory: Generar SQL de inicialización`.
4. Copia el SQL generado y ejecútalo en el **SQL Editor** de tu dashboard de Supabase.

### 2. Configurar la Extensión
1. Abre la **Paleta de Comandos** (`Ctrl+Shift+P` o `Cmd+Shift+P`).
2. Escribe y ejecuta el comando: `Shared Memory: Configurar Supabase`.
3. Ingresa la URL de tu proyecto y tu `service_role` key (segura).
4. Ajusta tu **Machine ID** (ej. "Laptop-Olympia") y tu **Status** en los ajustes de VS Code.

### 3. Conectar tu IA (Roo Code / Cline)
1. Abre la **Paleta de Comandos** (`Ctrl+Shift+P` o `Cmd+Shift+P`).
2. Escribe y ejecuta el comando: `Shared Memory: Copiar configuración MCP para Roo/Cline`.
3. Pega el JSON resultante en tu archivo de configuración de MCP (ej. `roo_code_custom_settings.json`).

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
