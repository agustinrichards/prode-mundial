# ⚽ Prode Mundial 2026

App de predicciones del Mundial FIFA 2026 para la oficina.

**Stack:** Next.js 14 · Neon (Postgres) · NextAuth.js · Tailwind CSS · Vercel

---

## Setup local — paso a paso

### 1. Descomprimir e instalar

```bash
tar -xzf prode-mundial-2026.tar.gz
cd prode-mundial
npm install
```

### 2. Crear proyecto en Neon

1. Ir a [neon.tech](https://neon.tech) → **New project**
2. Name: `prode-mundial`, Region: AWS São Paulo
3. Copiar la **DATABASE_URL** (empieza con `postgresql://...`)

### 3. Configurar variables de entorno

```bash
copy .env.example .env.local   # Windows
cp .env.example .env.local     # Mac/Linux
```

Abrir `.env.local` y completar:

```env
DATABASE_URL=postgresql://...   ← pegar la de Neon
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                ← ver abajo cómo generarlo
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=tu@email.com
```

**Generar NEXTAUTH_SECRET** (elegir una opción):
- En PowerShell: `[Convert]::ToBase64String((1..32 | % {[byte](Get-Random -Max 256)}))`
- En Mac/Linux: `openssl rand -base64 32`
- O usar cualquier string largo y aleatorio

### 4. Correr las migraciones (crear tablas + fixture)

```bash
npm run db:migrate
```

Esto crea todas las tablas y carga los 72 partidos de la fase de grupos.

### 5. Crear el usuario admin

```bash
node scripts/create-admin.js TuContraseña123
```

Usa el email de `ADMIN_EMAIL` en tu `.env.local`.

### 6. Correr la app

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) e ingresar con el email admin y la contraseña que elegiste.

---

## Deploy en Vercel

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# Crear repo en github.com, luego:
git remote add origin https://github.com/tuusuario/prode-mundial.git
git push -u origin main
```

### 2. Crear proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) → **Add New Project**
2. Importar el repo de GitHub
3. Framework: **Next.js** (se detecta solo)

### 3. Variables de entorno en Vercel

En **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Connection string de Neon |
| `NEXTAUTH_URL` | `https://tu-app.vercel.app` |
| `NEXTAUTH_SECRET` | El mismo que usaste en local |
| `NEXT_PUBLIC_APP_URL` | `https://tu-app.vercel.app` |
| `ADMIN_EMAIL` | Tu email de admin |

### 4. Correr migraciones en producción

Una vez deployado, en Vercel → **Functions** → correr el migrate, o temporalmente agregar una API route que lo ejecute. Lo más fácil: correr desde local apuntando a la DB de Neon (la misma DATABASE_URL sirve).

---

## Flujo de uso

### Admin
1. Ir a **Admin → Usuarios** → crear jugadores con nombre, email y contraseña
2. Durante el torneo: **Admin → Resultados** → cargar el resultado al terminar cada partido
3. Al final: **Admin → Apuestas especiales** → cargar campeón y goleador → calcular puntos

### Jugadores
1. Entrar con email y contraseña
2. **Predicciones** → ingresar marcadores antes del cierre de cada fecha
3. **Apuestas especiales** → elegir campeón, goleador y día LAGO (antes del cierre de Fecha 1)
4. **Clasificación** → ver tabla de posiciones

---

## Comodines

| Comodín | Qué hace | Usos disponibles |
|---|---|---|
| **CO2** | Doble puntos en ese partido | 6 (grupos) · 2 (R32) · 1 (R16) |
| **RIO** | Dos predicciones, gana la mejor | 6 (grupos) · 2 (R32) · 1 (QF) |
| **LAGO** | Suma los puntos del mejor jugador de un día elegido | 1 vez · solo grupos |

## Puntuación

| Resultado | Pts |
|---|---|
| Marcador exacto | 3 |
| Diferencia correcta | 2 |
| Solo resultado (G/E/P) | 1 |
| Fallo | 0 |

| Apuesta especial | 1ro | 2do | 3ro |
|---|---|---|---|
| Campeón | 10 | 5 | 2 |
| Goleador | 6 | 3 | 1 |
