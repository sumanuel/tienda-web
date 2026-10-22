# T-Suma

Sistema de punto de venta e inventario (ventas, compras, clientes,
proveedores, reportes) con moneda principal VES y referencia en USD.

- **Web:** Next.js (carpeta raíz).
- **API:** Express + Prisma + PostgreSQL (carpeta `backend/`).

## Puesta en marcha

Requisitos: Node.js 20+ (probado con Node 24) y PostgreSQL con la base
configurada en `backend/.env` (hay una plantilla en `backend/.env.example`).

```bash
npm install
npm --prefix backend install
```

### Desarrollo: un solo comando

```bash
npm run dev
```

Levanta la API (puerto 4000) y la web (puerto 3000) en **una sola terminal**,
con la salida de cada una marcada con `[api]` y `[web]`.

- **Ctrl+C** detiene las dos, con todos sus procesos hijos.
- Si una de las dos se cae, la otra se detiene también (no queda media app
  viva ocupando un puerto).
- Al arrancar revisa los puertos: si los ocupa un resto de una ejecución
  anterior **de este proyecto**, lo cierra; si los ocupa **otro programa**, no
  lo toca y avisa cuál es.

| Comando               | Qué hace                                                   |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Levanta API y web                                          |
| `npm run dev:stop`    | Cierra lo que haya quedado de este proyecto (por si acaso) |
| `npm run dev:restart` | `dev:stop` y luego `dev`                                   |
| `npm run dev:web`     | Solo la web (Next.js)                                      |
| `npm run dev:api`     | Solo la API                                                |

### Cambiar los puertos

Si otro programa usa el 3000 o el 4000, en PowerShell:

```powershell
$env:WEB_PORT=3100; $env:API_PORT=4100; npm run dev
```

El script ajusta solo el CORS de la API y el proxy de la web a esos puertos.

## Pruebas

```bash
npm test                      # web (Jest)
npm --prefix backend test     # API (runner de Node, sin base de datos)
```
