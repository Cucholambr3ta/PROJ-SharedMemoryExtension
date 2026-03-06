# Documentación Técnica — PROJ-SharedMemoryExtension

## Resumen Arquitectónico
La extensión opera como un puente entre el protocolo MCP (Model Context Protocol) y una instancia de Supabase proporcionada por el usuario (Modelo BYODB). Permite que múltiples instancias de agentes de IA (Antigravity, Roo Code, Cline) compartan una memoria persistente y sistema de mensajería de flota.

## Versión 1.0.2: Mejoras de Estabilidad y Multi-Base de Datos

### 1. Soporte Multi-Perfil (Perfiles)
La extensión ahora permite gestionar múltiples bases de datos Supabase de forma independiente:
- **Almacenamiento**: Los perfiles se guardan en el `globalState` de VS Code.
- **Seguridad**: Las llaves `service_role` se almacenan preferentemente en `SecretStorage`.
- **Conmutación**: El comando `switchProfile` permite alternar la conexión activa, reiniciando los servicios de heartbeat y polling en tiempo real.

### 2. Parche de Resiliencia para Linux (SecretStorage Fallback)
En entornos GNU/Linux donde no existe un llavero de sistema configurado (ej. `gnome-keyring`), la API `SecretStorage` de VS Code puede fallar silenciosamente. 
- se implementó un mecanismo de **fallback** que redirige el almacenamiento de llaves sensibles hacia el `globalState` (cifrado por el propio editor) para asegurar que la extensión sea funcional en cualquier distribución.

### 3. Sistema de Flota (Presence & Messaging)
- **Heartbeat**: Actualiza la tabla `fleet_nodes` con el ID de máquina y versión del agente.
- **Mensajería**: Escucha mensajes en `fleet_messages` dirigidos al ID local o al canal `ALL`.

## Mantenimiento
Para compilar y empaquetar nuevamente el proyecto:
```bash
npm install
npm run compile
vsce package
```

---

Desarrollado por [OLYMP-IA](https://olymp-ia.cl) · Supremacía Digital
