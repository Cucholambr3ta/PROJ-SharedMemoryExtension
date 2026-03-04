# Memoria Técnica: Shared Memory MCP (Fleet V2)

## Arquitectura de Sistema
La extensión `PROJ-SharedMemoryExtension` actúa como un puente de alta seguridad entre los agentes de IA (Hosts MCP) y una instancia privada de Supabase. Utiliza el modelo **BYODB** (Bring Your Own Database) para garantizar la soberanía de datos.

### Componentes Clave
1. **VS Code Extension (Frontend)**: Gestiona la configuración, los secretos (`SecretStorage`) y el motor de **Heartbeat**.
2. **MCP Server (Backend)**: Ejecuta las herramientas de memoria y mensajería a través del protocolo `stdio`.
3. **Supabase Layer**: Persistencia inyectada por el usuario.

## Protocolos de Comunicación
- **Heartbeat**: Ping asíncrono cada `X` segundos (configurable) que actualiza la tabla `fleet_nodes`.
- **Messaging**: Sistema de buzón persistente en `fleet_messages` con soporte para `ALL` (Broadcast) y IDs individuales.

## Herramientas MCP
| Herramienta | Función |
|-------------|---------|
| `save_memory` | Inserción en `shared_memories` |
| `search_memory` | Búsqueda semántica (ilike) |
| `list_fleet_nodes` | Lectura de presencia global |
| `send_fleet_message` | Broadcast o mensaje directo |
| `read_fleet_messages` | Lectura selectiva por ID |

## Seguridad
- Las llaves de Supabase nunca se guardan en texto plano en el espacio de trabajo.
- Se utiliza el llavero del sistema operativo a través de la API `vscode.secrets`.

---

Desarrollado por [OLYMP-IA](https://olymp-ia.cl) · Supremacía Digital
