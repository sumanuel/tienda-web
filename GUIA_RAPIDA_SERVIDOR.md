# Guía Rápida - Evitar Problemas de Puerto Ocupado

## 🎯 De Ahora en Adelante - Usa Estos Comandos

### ✅ Para Iniciar el Servidor (Primera vez del día)

```bash
cd backend
npm run restart
```

**¿Por qué?** Este comando:

1. ✅ Verifica si el puerto 4000 está ocupado
2. ✅ Lo libera automáticamente si está ocupado
3. ✅ Inicia el servidor limpiamente

### ✅ Para Detener el Servidor (Al terminar de trabajar)

```
Ctrl+C en la terminal del servidor
```

**Espera a ver este mensaje:**

```
✅ Servidor cerrado correctamente
```

### ❌ NUNCA HAGAS ESTO

```
❌ Ctrl+Z (suspende sin cerrar - deja proceso zombi)
❌ Cerrar la terminal sin Ctrl+C primero
❌ Matar la terminal desde el Task Manager
```

## 🚨 Si el Servidor Se Cuelga o Da Error de Puerto

### Opción 1: Reinicio Automático (Recomendado)

```bash
cd backend
npm run restart
```

### Opción 2: Solo Liberar Puerto

```bash
cd backend
npm run kill-port
npm run dev
```

## 📝 Comandos Disponibles

| Comando             | Qué Hace                                    |
| ------------------- | ------------------------------------------- |
| `npm run restart`   | Mata proceso en 4000 + inicia servidor      |
| `npm run dev`       | Solo inicia servidor (sin verificar puerto) |
| `npm run kill-port` | Solo mata proceso en 4000                   |

## 🔍 Cómo Saber Si Hay Un Problema

### ✅ Servidor Funcionando Bien

Verás esto en la terminal:

```
🚀 Server running on http://localhost:4000
📡 Network: http://10.2.0.2:4000
📊 Environment: development
🔐 CORS enabled for: http://localhost:3000
```

### ❌ Puerto Ocupado

Verás esto:

```
❌ Error: Puerto 4000 ya está en uso. Ejecuta este comando para liberarlo:
   Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess | Stop-Process -Force
```

**Solución:** Ejecuta `npm run restart`

### ❌ Error de Login "Failed to fetch"

**Causa:** El backend no está corriendo o se colgó

**Solución:**

```bash
cd backend
npm run restart
```

## 💡 Workflow Recomendado

### Al Empezar el Día

```bash
# Terminal 1 - Backend
cd d:\Mis proyectos\tienda-web\backend
npm run restart

# Terminal 2 - Frontend
cd d:\Mis proyectos\tienda-web
yarn dev
```

### Al Terminar el Día

```bash
# Terminal Backend: Ctrl+C (espera a "✅ Servidor cerrado correctamente")
# Terminal Frontend: Ctrl+C
```

### Durante el Desarrollo

- Backend: Déjalo corriendo con `tsx watch` (se recarga automáticamente)
- Frontend: Déjalo corriendo con `yarn dev` (se recarga automáticamente)

**Solo reinicia si:**

- ✅ Cambias variables de entorno (.env)
- ✅ Instalas nuevas dependencias
- ✅ Hay un error que no se auto-recupera

## 🎓 Resumen

**Antes (Problemático):**

```bash
npm run dev  # ❌ Si el puerto está ocupado, falla
```

**Después (Sin Problemas):**

```bash
npm run restart  # ✅ Siempre funciona, limpia puerto automáticamente
```

## 🆘 Comando de Emergencia

Si TODO falla, copia y pega esto:

```bash
cd d:\Mis proyectos\tienda-web\backend; npm run restart
```

Esto SIEMPRE arregla el problema.
