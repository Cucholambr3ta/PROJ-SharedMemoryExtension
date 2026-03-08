# Documentación Técnica — Shared Memory: Divine Essence

## Resumen Arquitectónico
La extensión opera como un puente de alta fidelidad entre el protocolo MCP y una instancia de Supabase de la flota. Como parte del ecosistema **OLYMP-IA Divine Fleet**, asegura la persistencia del conocimiento de nivel empresarial mediante el modelo BYODB.

## Versión 1.0.2: Branding Inoculated & Stability

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
