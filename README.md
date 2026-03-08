# Shared Memory: Divine Essence

Extensión de nivel empresarial que dota a la flota de una memoria persistente universal y comunicación inter-agente de alta fidelidad utilizando el protocolo **MCP** y **Supabase** (Modelo BYODB).

## Guía de Instalación para Beta Testers

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

### 2. Configurar e Inyectar la Extensión
1. Abre la **Paleta de Comandos** (`Ctrl+Shift+P` o `Cmd+Shift+P`).
2. Escribe y ejecuta el comando: `Shared Memory: Configurar Supabase`.
3. El asistente te mostrará 4 ventanas. Deberás ingresar:
   * **Nombre de Perfil** (ej. "Flota Principal", "Proyecto B").
   * **URL** de tu proyecto Supabase.
   * **Service Role Key** secreta.
   * **Nombre o Identificador** (ej. "Juan-Marketing", "Laptop-PC"). *Este será tu nombre en esta base de datos para que el resto de la flota sepa quién está aportando conocimientos.*
4. ¡Listo! La extensión configurará el acceso para este perfil **e inyectará automáticamente** la conexión a los clientes de tu entorno (ej. Antigravity, Roo Code o Cline). 

### 3. (Opcional) Multi-Base de Datos: Cambiar de Flota
Si colaboras con múltiples equipos o proyectos, puedes conectarte a diferentes bases de datos Supabase:
1. Simplemente repite el "Paso 2" para agregar una nueva flota. Tus credenciales se guardarán bajo su propio Perfil.
2. Para cambiar sobre la marcha a qué base de datos está conectada tu IA, ejecuta el comando de VS Code:
   `Shared Memory: Cambiar de Base de Datos Activa`
3. Esto pausará tu presencia en la base de datos anterior e "inyectará" de inmediato a tu IA a la nueva flota en 1 segundo.
4. Para eliminar perfiles antiguos, usa: `Shared Memory: Eliminar Perfil de Base de Datos`.

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
