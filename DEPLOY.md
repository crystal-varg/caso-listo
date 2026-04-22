# 🚀 Guía de Deploy — CasoListo

**Frontend → Vercel** (gratis)
**Backend + DB → Railway** (gratis hasta $5/mes de uso)

Tiempo estimado: **20–30 minutos** la primera vez.

---

## PARTE 1 — Subir el código a GitHub

Esto es obligatorio: tanto Vercel como Railway se conectan a GitHub.

### 1.1 Crear el repositorio

1. Ir a https://github.com/new
2. Nombre: `caso-listo`
3. Privado ✅ (recomendado)
4. **No** inicializar con README
5. Crear repositorio

### 1.2 Subir el código

Desde la raíz del proyecto (`caso-listo/`):

```bash
git init
git add .
git commit -m "feat: CasoListo MVP v1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/caso-listo.git
git push -u origin main
```

> Reemplazá `TU_USUARIO` con tu usuario de GitHub.

---

## PARTE 2 — Deploy del Backend en Railway

Railway hospeda el backend NestJS y la base de datos PostgreSQL.

### 2.1 Crear cuenta y proyecto

1. Ir a https://railway.app
2. **Sign in with GitHub**
3. Click **New Project**
4. Elegir **Deploy from GitHub repo**
5. Seleccionar el repo `caso-listo`
6. Cuando pregunte qué directorio: escribir `backend`

Railway va a detectar automáticamente que es Node.js y va a usar el `railway.toml` que ya está configurado.

### 2.2 Agregar PostgreSQL

Dentro del proyecto en Railway:

1. Click **+ New** → **Database** → **Add PostgreSQL**
2. Railway crea la DB automáticamente y la conecta al proyecto

Esto genera la variable `DATABASE_URL` de forma automática — el backend ya está preparado para leerla.

### 2.3 Configurar variables de entorno

En Railway, ir a tu servicio backend → **Variables** → agregar:

```
NODE_ENV=production
JWT_SECRET=genera-algo-largo-y-seguro-aca-ej-uuid4
FRONTEND_URL=https://caso-listo.vercel.app

# Email (necesario para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=tu-app-password-de-gmail
```

> **Para generar JWT_SECRET seguro:** corré `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` en tu terminal.

> **Para SMTP_PASS con Gmail:** Google Account → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación → Generar.

### 2.4 Obtener la URL del backend

Una vez desplegado, Railway te da una URL del estilo:
```
https://caso-listo-backend-production.up.railway.app
```

**Guardala** — la necesitás para el paso siguiente.

### 2.5 Verificar que funciona

Abrí en el navegador:
```
https://TU-URL-RAILWAY.up.railway.app/api/auth/me
```

Deberías ver:
```json
{"statusCode": 401, "message": "Unauthorized"}
```

Eso significa que el backend está corriendo y respondiendo correctamente.

---

## PARTE 3 — Deploy del Frontend en Vercel

### 3.1 Crear cuenta

1. Ir a https://vercel.com
2. **Sign in with GitHub**

### 3.2 Importar el proyecto

1. Click **Add New Project**
2. Importar el repo `caso-listo`
3. En **Root Directory**: escribir `frontend`
4. Framework: Next.js (lo detecta solo)

### 3.3 Configurar variable de entorno

Antes de hacer click en Deploy, agregar:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://TU-URL-RAILWAY.up.railway.app/api` |

> Reemplazá con la URL real de Railway del paso 2.4.

### 3.4 Deploy

Click en **Deploy**. En 2–3 minutos tenés el frontend live.

Vercel te da una URL del estilo:
```
https://caso-listo.vercel.app
```

### 3.5 Actualizar FRONTEND_URL en Railway

Ahora que tenés la URL de Vercel, volvé a Railway → Variables y actualizá:

```
FRONTEND_URL=https://caso-listo.vercel.app
```

Esto le dice al backend desde dónde puede recibir requests (CORS).

---

## PARTE 4 — Verificar todo end-to-end

Seguí estos pasos para confirmar que todo funciona:

### ✅ Test 1 — Registro
1. Ir a `https://caso-listo.vercel.app/register`
2. Crear una cuenta con tu nombre, email y estudio
3. Deberías quedar logueado y ver el dashboard

### ✅ Test 2 — Formulario público
1. En el sidebar del dashboard, copiá tu slug
2. Abrir en otra pestaña: `https://caso-listo.vercel.app/consulta/TU-SLUG`
3. Completar el formulario como si fueras un cliente
4. Deberías recibir un email de notificación (si configuraste SMTP)

### ✅ Test 3 — Panel del abogado
1. Volver al dashboard
2. La consulta debería aparecer en "Consultas recientes"
3. Hacer click → cambiar estado y fuero
4. Verificar que se guarda

---

## PARTE 5 — Dominio propio (opcional)

Si tenés un dominio (ej: `casolisto.com.ar`):

**Vercel:**
1. Dashboard → tu proyecto → Settings → Domains
2. Agregar tu dominio
3. Seguir instrucciones de DNS

**Railway:**
1. Tu servicio → Settings → Networking → Custom Domain
2. Agregar subdominio ej: `api.casolisto.com.ar`
3. Actualizar `FRONTEND_URL` en Railway y `NEXT_PUBLIC_API_URL` en Vercel

---

## Variables de entorno — Resumen completo

### Backend (Railway)
```
NODE_ENV=production
DATABASE_URL=          ← Lo pone Railway automáticamente
JWT_SECRET=            ← Generalo vos (ver arriba)
FRONTEND_URL=          ← URL de Vercel
PORT=                  ← Lo pone Railway automáticamente
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=             ← App Password de Gmail
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://TU-URL-RAILWAY.up.railway.app/api
```

---

## Actualizar el código en producción

Cada vez que hagas cambios y los subas a GitHub:

```bash
git add .
git commit -m "descripcion del cambio"
git push
```

Vercel y Railway se actualizan **automáticamente** — no necesitás hacer nada más.

---

## Costos estimados

| Servicio | Plan | Costo |
|---|---|---|
| Vercel | Hobby | **Gratis** |
| Railway | Starter | **Gratis** (~$5 de crédito/mes, más que suficiente para MVP) |
| Gmail SMTP | — | **Gratis** |
| **Total** | | **$0/mes** |

---

## Problemas comunes

**"Error de CORS"** en el frontend
→ Verificar que `FRONTEND_URL` en Railway coincide exactamente con la URL de Vercel (sin `/` al final).

**El backend no arranca en Railway**
→ Revisar los logs en Railway → tu servicio → Deployments → ver logs. Suele ser una variable de entorno faltante.

**No llegan emails**
→ Verificar que `SMTP_PASS` es una App Password (no tu contraseña normal de Gmail). Activar verificación en 2 pasos primero.

**"Cannot find module"** en Railway
→ Asegurarse de que el Root Directory en Railway esté configurado como `backend`.

---

*¿Algo no funciona? Revisá los logs de Railway (tu servicio → Deployments) y los de Vercel (tu proyecto → Functions). Ahí se ve exactamente qué falló.*
