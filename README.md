# English Study Group App

Aplicación web para practicar vocabulario en inglés, diseñada para uso individual y grupal. Combina técnicas de aprendizaje activo con mecánicas de sesiones interactivas para grupos pequeños.

## ¿Qué hace?

**Modo individual**
- Banco personal de palabras con múltiples traducciones, ejemplos y explicaciones
- Práctica mediante flashcards, selección múltiple y escritura
- Selección de palabras por probabilidad ponderada inversamente al nivel de dominio
- Progreso por palabra: sube con 2 aciertos consecutivos, baja con 1 fallo
- Importación de palabras desde Excel

**Modo grupal**
- Crear o unirse a un grupo con código de invitación
- Banco compartido que se descarga automáticamente al banco personal con fusión inteligente
- Sesiones de práctica en dos modos:
  - **Remoto** — cada miembro desde su dispositivo, asíncrono, máximo 8 horas
  - **Presencial** — un solo dispositivo, conductor fijo, turnos por orden aleatorio

**Mecánica de sesión**
Cada palabra se practica en 4 pasos: adivinanza con frase incompleta → traducción → construcción de frase → revisión de ficha completa. Los roles rotan entre los miembros por turno.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + Vite |
| Estilos | Tailwind CSS |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth — Email/Password |
| Routing | react-router-dom |
| Excel | xlsx |

---

## Documentación

Toda la documentación del proyecto está en `/docs`:

| Archivo | Contenido |
|---------|-----------|
| `01_problem_definition.md` | Contexto, problema, usuarios y criterios de éxito |
| `02_requirements.md` | Requerimientos funcionales (RF-01 a RF-11) y no funcionales |
| `03_system_design.md` | Modelo de datos, reglas de negocio y flujos |
| `04_technical_spec.md` | Schema SQL, RLS policies, queries y convenciones de código |
| `06_testing_validation.md` | Checklist de verificación manual (83 escenarios) |

---

## Requisitos previos

- Node.js >= 18.x
- npm >= 9.x
- Cuenta en [Supabase](https://supabase.com)
- Proyecto Supabase configurado con las tablas y RLS

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd english-study-app

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Supabase

# 4. Ejecutar migraciones SQL en Supabase Dashboard
# Copiar el contenido de supabase/schema_complete.sql y ejecutar en SQL Editor

# 5. Crear usuarios de prueba en Supabase Dashboard → Authentication → Users

# 6. Iniciar el servidor de desarrollo
npm run dev
```

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz con:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Los valores se obtienen en **Supabase Dashboard → Settings → API**.

---

## Configuración inicial en Supabase

### 1. Ejecutar Schema SQL

1. Ir a **Supabase Dashboard → SQL Editor**
2. Copiar todo el contenido de `supabase/schema_complete.sql`
3. Ejecutar el script

### 2. Crear usuarios de prueba

1. Ir a **Supabase Dashboard → Authentication → Users**
2. Click en **Add User** → **Create new user**
3. Ingresar email y una contraseña inicial
4. Una vez creado el usuario en auth.users, insertar en la tabla `profiles`:
   - El `id` debe ser el UUID del usuario en auth.users
   - `username`: nombre visible para el usuario (ej: "Juan")
   - `avatar_color`: color hex para el avatar (ej: `#4F46E5`)

### 3. Habilitar Email Provider

1. Ir a **Supabase Dashboard → Authentication → Providers → Email**
2. Habilitar **"Enable Email Sign-in"**
3. Opcional: deshabilitar **"Confirm Email"** para testing

---

## Estructura del proyecto

```
english-study-app/
├── AGENTS.md                    ← instrucciones para el agente de IA
├── README.md
├── docs/                        ← documentación del proyecto
├── supabase/
│   ├── migrations/              ← archivos SQL de migraciones
│   ├── schema_complete.sql      ← SQL completo para ejecutar en Dashboard
│   └── config.toml
└── src/
    ├── components/              ← componentes reutilizables
    ├── pages/                  ← una página por ruta
    ├── hooks/                  ← lógica por entidad o flujo
    ├── lib/                    ← utilidades y cliente Supabase
    └── context/                ← estado global (auth)
```

---

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run preview  # previsualizar build
npm run lint     # linting
```

---

## Funcionalidades implementadas

### RF-01 · Autenticación
- ✅ Login con email y contraseña (signInWithPassword)
- ✅ Usuarios pre-creados por administrador
- ✅ Perfil con username y avatar_color
- ✅ Sesión persistente (no requiere re-login hasta signOut)

### RF-02 · Banco de palabras personal
- ✅ CRUD de palabras con traducciones
- ✅ Exportar palabras al grupo

### RF-03 · Banco de frases personal
- ✅ CRUD de frases asociadas a traducciones

### RF-04 · Sistema de práctica individual
- ✅ Flashcard, Quiz, Writing
- ✅ Selección ponderada por nivel

### RF-05 · Sistema de progreso
- ✅ Nivel 0-5 por palabra
- ✅ Aciertos consecutivos para subir
- ✅ Un fallo para bajar

### RF-06 · Grupos
- ✅ Crear, unirse con código
- ✅ Fusión de palabras al unirse
- ✅ Exportar palabras al grupo

### RF-07 · Progreso grupal y sincronización
- ✅ Progreso por miembro dentro del grupo
- ✅ Sincronización al unirse

### RF-08 · Importación desde Excel
- ✅ Parser xlsx con fusión
- ✅ Plantilla descargable
- ✅ Resumen de importación

### RF-09 · Sesiones grupales
- ✅ Una sesión activa por grupo
- ✅ Creación de sesión

### RF-10 · Mecánica de sesión remota
- ✅ 4 pasos por turno
- ✅ Roles por turno

### RF-11 · Mecánica de sesión presencial
- ✅ Confirmación de asistencia
- ✅ Orden aleatorio
- ✅ Conductor fijo
- ✅ Panel lateral de turno

---

## Estados del proyecto

| Fase | Estado |
|------|--------|
| Problem Definition | ✅ Completo |
| Requirements | ✅ Completo |
| System Design | ✅ Completo |
| Technical Spec | ✅ Completo |
| Implementation | ✅ Completo |
| Testing & Validation | ⏳ Pendiente |
