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
| Autenticación | Supabase Auth — Google OAuth |
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
- Supabase CLI
- Cuenta en [Supabase](https://supabase.com)
- Proyecto en [Google Cloud Console](https://console.cloud.google.com) para OAuth

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

# 4. Vincular con el proyecto Supabase
supabase login
supabase link --project-ref <project-ref>

# 5. Ejecutar migraciones
supabase db push

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

## Estructura del proyecto

```
english-study-app/
├── AGENTS.md                    ← instrucciones para el agente de IA
├── README.md
├── docs/                        ← documentación del proyecto
├── supabase/
│   ├── migrations/              ← archivos SQL de migraciones
│   └── config.toml
└── src/
    ├── components/              ← componentes reutilizables
    ├── pages/                   ← una página por ruta
    ├── hooks/                   ← lógica por entidad o flujo
    ├── lib/                     ← utilidades y cliente Supabase
    └── context/                 ← estado global (auth)
```

---

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run preview  # previsualizar build
```

---

## Fases del proyecto

| # | Fase | Estado |
|---|------|--------|
| 1 | Problem Definition | ✅ Completo |
| 2 | Requirements | ✅ Completo |
| 3 | System Design | ✅ Completo |
| 4 | Technical Spec | ✅ Completo |
| 5 | Implementation | ⏳ Pendiente |
| 6 | Testing & Validation | ✅ Completo |
