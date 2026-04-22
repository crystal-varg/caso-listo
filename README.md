# CasoListo — MVP v1

Sistema de gestión de consultas para estudios jurídicos.

---

## ¿Qué hace este MVP?

- ✅ Formulario público para que clientes envíen consultas
- ✅ Notificación por email al abogado cuando llega una consulta
- ✅ Panel del abogado con login JWT
- ✅ Dashboard con estadísticas
- ✅ Lista de consultas con filtros por estado y fuero
- ✅ Vista de detalle de cada consulta
- ✅ Cambio de estado (nuevo → en proceso → cerrado) con un click
- ✅ Clasificación por fuero (Laboral, Penal, Civil, etc.)
- ✅ Botones de acción rápida: responder por email, WhatsApp

---

## Levantar con Docker (recomendado)

```bash
docker-compose up --build
```

Eso levanta:
- PostgreSQL en `localhost:5432`
- Backend (NestJS) en `localhost:3001`
- Frontend (Next.js) en `localhost:3000`

---

## Levantar manualmente (desarrollo)

### 1. Base de datos

Necesitás PostgreSQL corriendo. Podés usar Docker solo para la DB:

```bash
docker run -d \
  --name caso_listo_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=caso_listo \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Editá .env con tus credenciales de email si querés notificaciones
npm install
npm run start:dev
```

El backend crea las tablas automáticamente (TypeORM `synchronize: true`).

### 3. Frontend

```bash
cd frontend
# .env.local ya está configurado para dev
npm install
npm run dev
```

---

## URLs

| Recurso | URL |
|---|---|
| Landing page | http://localhost:3000 |
| Registro | http://localhost:3000/register |
| Login | http://localhost:3000/login |
| Dashboard | http://localhost:3000/dashboard |
| API | http://localhost:3001/api |
| Formulario público | http://localhost:3000/consulta/{slug} |

El `slug` lo encontrás en el panel del abogado, en el sidebar izquierdo.

---

## Configurar notificaciones por email

Editá `backend/.env` y completá:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=tu-app-password
```

Para Gmail necesitás crear una **App Password**:
1. Ir a Google Account → Seguridad → Verificación en 2 pasos → Contraseñas de apps
2. Generá una y pegala en `SMTP_PASS`

Sin estas variables configuradas, el sistema funciona igual pero **no envía emails** (solo loguea en consola).

---

## Endpoints del API

### Auth
```
POST /api/auth/register   — Crear cuenta (nombre, email, password, nombre_estudio)
POST /api/auth/login      — Login (email, password)
GET  /api/auth/me         — Perfil del usuario autenticado
```

### Consultas
```
POST /api/consultas/publica/:slug   — Enviar consulta (público, sin auth)
GET  /api/consultas                 — Listar consultas del abogado
GET  /api/consultas/stats           — Estadísticas del dashboard
GET  /api/consultas/:id             — Ver una consulta
PATCH /api/consultas/:id            — Actualizar estado/fuero
```

### Estudios
```
GET /api/estudios/mio   — Datos del estudio del abogado autenticado
```

---

## Estructura del proyecto

```
caso-listo/
├── backend/
│   └── src/
│       ├── auth/          — JWT, login, registro
│       ├── users/         — Entidad y servicio de abogados
│       ├── consultas/     — Core: recepción y gestión de consultas
│       ├── estudios/      — Estudio jurídico + slug público
│       └── mail/          — Notificaciones por email
├── frontend/
│   └── app/
│       ├── page.tsx                          — Landing page
│       ├── login/                            — Login
│       ├── register/                         — Registro
│       ├── dashboard/                        — Panel del abogado
│       │   ├── page.tsx                      — Dashboard principal
│       │   └── consultas/
│       │       ├── page.tsx                  — Lista de consultas
│       │       └── [id]/page.tsx             — Detalle de consulta
│       └── consulta/[slug]/page.tsx          — Formulario público para clientes
└── docker-compose.yml
```

---

## Próximos pasos (FASE 2)

- [ ] Notificaciones por WhatsApp (Twilio o WATI)
- [ ] Checklist de documentos por consulta
- [ ] Agenda legal con vencimientos
- [ ] Portal del cliente (tracking de su caso)
- [ ] Generador de escritos con IA
- [ ] Panel de honorarios

---

*CasoListo — Hecho para abogados argentinos que quieren trabajar mejor.*
