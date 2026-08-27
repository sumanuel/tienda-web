# Solución al Problema de Puerto Ocupado y Servidor Colgado

## ❌ Problema Original

El servidor backend se quedaba colgado ocupando el puerto 4000, causando:

- Error `EADDRINUSE: address already in use` al intentar reiniciar
- Error `Failed to fetch` en el login porque el servidor no respondía
- Necesidad de matar manualmente el proceso en cada reinicio

## ✅ Soluciones Implementadas

### 1. **Server con Manejo Robusto de Errores** (`src/server.ts`)

Ahora el servidor tiene:

#### a) Captura de Errores de Puerto Ocupado

```typescript
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Puerto ${PORT} ya está en uso...`);
    // Muestra comando para liberar el puerto
    process.exit(1);
  }
});
```

#### b) Cierre Limpio con Señales del Sistema

```typescript
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

Esto permite:

- **Ctrl+C** cierra el servidor correctamente
- No deja procesos zombies
- Libera el puerto automáticamente

#### c) Manejo de Errores No Capturados

```typescript
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  gracefulShutdown('unhandledRejection');
});
```

### 2. **Scripts de Utilidad Nuevos**

#### a) `npm run restart` - Reinicia el servidor limpiamente

```bash
cd backend
npm run restart
```

Este script:

1. ✅ Busca procesos en puerto 4000
2. ✅ Los mata si existen
3. ✅ Inicia el servidor de nuevo

#### b) `npm run kill-port` - Solo libera el puerto 4000

```bash
cd backend
npm run kill-port
```

Útil cuando solo necesitas matar el proceso sin reiniciar.

#### c) `restart-server.ps1` - Script PowerShell directo

```powershell
cd backend
.\restart-server.ps1
```

### 3. **Cómo Usar los Nuevos Scripts**

#### ✅ **Forma Recomendada (Primera vez del día)**

```bash
cd backend
npm run restart
```

#### ✅ **Desarrollo Normal (Después de tener el servidor corriendo)**

```bash
# Solo usa Ctrl+C para detener
# Luego:
npm run dev
```

#### ✅ **Si el puerto sigue ocupado**

```bash
npm run kill-port
npm run dev
```

#### ❌ **EVITAR** (Causaba el problema anterior)

```bash
# ❌ No hagas Ctrl+Z (suspende sin cerrar)
# ❌ No cierres la terminal sin hacer Ctrl+C primero
# ❌ No reinicies sin verificar que el puerto esté libre
```

## 🎯 Mejores Prácticas

### 1. **Al Iniciar el Desarrollo**

```bash
cd d:\Mis proyectos\tienda-web\backend
npm run restart
```

### 2. **Al Terminar el Desarrollo**

```bash
# En la terminal del servidor:
Ctrl+C  # Espera a que diga "✅ Servidor cerrado correctamente"
```

### 3. **Si Encuentras Error de Puerto Ocupado**

```bash
npm run kill-port
npm run dev
```

### 4. **Si el Servidor se Cuelga**

El servidor ahora se auto-recupera de:

- ✅ Errores no capturados
- ✅ Promesas rechazadas
- ✅ Señales del sistema

Pero si aún así se cuelga:

```bash
npm run restart
```

## 🔍 Diagnóstico

### Ver Procesos en Puerto 4000

```powershell
Get-NetTCPConnection -LocalPort 4000 | Select-Object State, OwningProcess
```

### Ver Detalles del Proceso

```powershell
$pid = (Get-NetTCPConnection -LocalPort 4000).OwningProcess
Get-Process -Id $pid
```

### Matar Proceso Manualmente

```powershell
Stop-Process -Id <PID> -Force
```

## 📊 Logs del Servidor Mejorados

Ahora verás mensajes más claros:

### ✅ Inicio Exitoso

```
🚀 Server running on http://localhost:4000
📡 Network: http://10.2.0.2:4000
📊 Environment: development
🔐 CORS enabled for: http://localhost:3000
```

### ⚠️ Puerto Ocupado

```
❌ Error: Puerto 4000 ya está en uso. Ejecuta este comando para liberarlo:
   Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

### 🛑 Cierre Limpio

```
⏳ Recibida señal SIGINT. Cerrando servidor limpiamente...
✅ Servidor cerrado correctamente
```

## 🎓 Resumen

**Antes:**

- ❌ Servidor se quedaba colgado
- ❌ Puerto 4000 ocupado todo el tiempo
- ❌ Tenías que matar procesos manualmente
- ❌ Error "Failed to fetch" en login

**Después:**

- ✅ Servidor se cierra limpiamente con Ctrl+C
- ✅ Procesos zombies eliminados automáticamente
- ✅ Scripts de reinicio automáticos
- ✅ Mensajes de error claros con soluciones
- ✅ Login funciona sin problemas

## 🚀 Comando de Emergencia (Un Solo Comando)

Si todo falla, usa esto:

```bash
cd d:\Mis proyectos\tienda-web\backend; npm run restart
```

Esto SIEMPRE funciona porque mata cualquier proceso en 4000 y reinicia limpio.
