# 🚀 Guía de Configuración Rápida - TiendaWeb

## Paso 1: Configurar Firebase

### 1.1 Crear Proyecto en Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Click en "Agregar proyecto"
3. Nombre: `tienda-web-prod` (o el que prefieras)
4. Desactivar Google Analytics (opcional)
5. Click en "Crear proyecto"

### 1.2 Habilitar Authentication

1. En el panel izquierdo, click en "Authentication"
2. Click en "Comenzar"
3. En la pestaña "Sign-in method":
   - Habilitar **Email/Password**
   - Habilitar **Google** (opcional)

### 1.3 Crear Base de Datos Firestore

1. En el panel izquierdo, click en "Firestore Database"
2. Click en "Crear base de datos"
3. Seleccionar **"Comenzar en modo de producción"**
4. Seleccionar ubicación (preferiblemente más cercana)
5. Click en "Habilitar"

### 1.4 Configurar Reglas de Firestore

Ir a la pestaña "Reglas" y reemplazar con:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura solo a usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Regla específica para usuarios
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click en "Publicar".

### 1.5 Configurar Storage (opcional para Fase 1)

1. En el panel izquierdo, click en "Storage"
2. Click en "Comenzar"
3. Seleccionar modo de producción
4. Click en "Listo"

### 1.6 Obtener Credenciales

1. Click en el ícono de **engranaje ⚙️** junto a "Descripción general del proyecto"
2. Click en "Configuración del proyecto"
3. Scroll hasta "Tus apps"
4. Click en el ícono de **</> (Web)**
5. Registrar app con nombre: `tienda-web`
6. **COPIAR** las credenciales que aparecen:

```javascript
const firebaseConfig = {
  apiKey: 'AIzaSy...',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  storageBucket: 'tu-proyecto.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc123',
};
```

---

## Paso 2: Configurar Variables de Entorno

### 2.1 Editar .env.local

1. Abrir el archivo: `D:\Mis proyectos\tienda-web\.env.local`
2. Reemplazar las credenciales con las de Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy... (tu apiKey real)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

3. Guardar el archivo

---

## Paso 3: Ejecutar la Aplicación

### 3.1 Iniciar Servidor de Desarrollo

```bash
cd "D:\Mis proyectos\tienda-web"
npm run dev
```

Esperar el mensaje:

```
✓ Ready in 2s
○ Local:   http://localhost:3000
```

### 3.2 Abrir en Navegador

1. Abrir Chrome/Edge en: http://localhost:3000
2. Serás redirigido automáticamente a http://localhost:3000/login

---

## Paso 4: Crear Tu Primera Cuenta

### 4.1 Registro

1. En la pantalla de login, click en **"Regístrate aquí"**
2. Completar formulario:
   - Nombre Completo: `Tu Nombre`
   - Email: `tu@email.com`
   - Contraseña: `tu_password_segura` (mínimo 6 caracteres)
   - Confirmar Contraseña: `tu_password_segura`
3. Click en **"Registrarse"**

### 4.2 Verificación

Si todo está correcto:

- ✅ Verás toast: "¡Cuenta creada exitosamente!"
- ✅ Serás redirigido a `/dashboard`
- ✅ Verás el dashboard con tu nombre: "¡Bienvenido, Tu Nombre!"

### 4.3 Verificar en Firebase

1. Ir a Firebase Console → Authentication
2. Deberías ver tu usuario registrado
3. Ir a Firestore Database
4. Deberías ver colección `users` con tu documento

---

## Paso 5: Explorar la Aplicación

### Navegación Disponible

- **Dashboard**: `/dashboard` - Pantalla principal con KPIs
- **Punto de Venta**: `/dashboard/pos` - (Pendiente Fase 2)
- **Productos**: `/dashboard/products` - (Pendiente Fase 2)
- **Clientes**: `/dashboard/customers` - (Pendiente Fase 4)
- **Proveedores**: `/dashboard/suppliers` - (Pendiente Fase 4)
- **Reportes**: `/dashboard/reports` - (Pendiente Fase 6)
- **Configuración**: `/dashboard/settings` - (Pendiente)

### Funcionalidades Actuales (Fase 1)

✅ **Login/Logout**: Funcional  
✅ **Registro**: Funcional  
✅ **Dashboard**: Con KPIs placeholder  
✅ **Navegación**: Sidebar y header funcionan  
⏳ **POS**: Pendiente Fase 2  
⏳ **Productos**: Pendiente Fase 2

---

## Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"

**Solución**: Verificar que las credenciales en `.env.local` son correctas

### Error: "Firebase: Error (auth/network-request-failed)"

**Solución**: Verificar conexión a internet

### Pantalla blanca después de registrar

**Solución**:

1. Abrir consola del navegador (F12)
2. Ver errores en la pestaña "Console"
3. Verificar que Firebase está configurado correctamente

### No aparece el usuario en Firestore

**Solución**:

1. Verificar reglas de Firestore
2. Ver errores en consola del navegador
3. Verificar que `auth.ts` tiene permisos de escritura

---

## Comandos Útiles

```bash
# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar producción
npm start

# Verificar errores TypeScript
npx tsc --noEmit

# Formatear código
npm run format (si está configurado)
```

---

## Próximos Pasos

Una vez que tengas la aplicación funcionando:

1. ✅ Verificar que puedes hacer login/logout
2. ✅ Explorar el dashboard
3. ⏳ Esperar Fase 2 para comenzar a crear productos
4. ⏳ Esperar Fase 2 para usar el POS

---

## Soporte

Si encuentras algún error:

1. Revisar logs en consola del navegador (F12)
2. Revisar logs en terminal donde corre `npm run dev`
3. Verificar que Firebase está configurado correctamente
4. Verificar que todas las dependencias están instaladas (`npm install`)

---

**¡Listo!** 🎉 Ahora tienes TiendaWeb Fase 1 funcionando.

La aplicación está lista para comenzar el desarrollo de la **Fase 2: POS y Productos**.
