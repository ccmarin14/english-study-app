# AGENTS.md — English Study Group App

## Contexto del proyecto

Aplicación web para practicar vocabulario en inglés. Soporta uso individual y grupal. El diseño completo está documentado en la carpeta `/docs` del proyecto:

- `01_problem_definition.md` — qué problema resuelve
- `02_requirements.md` — requerimientos funcionales y no funcionales (RF-01 a RF-11)
- `03_system_design.md` — modelo de datos, reglas de negocio, flujos
- `04_technical_spec.md` — schema SQL, RLS policies, queries, convenciones de código
- `06_testing_validation.md` — checklist de verificación manual

Antes de implementar cualquier módulo, leer la sección correspondiente del Technical Spec.

---

## Stack

- **Frontend:** React + Vite
- **Estilos:** Tailwind CSS (solo clases utilitarias, sin CSS custom salvo casos justificados)
- **Backend / DB:** Supabase (PostgreSQL + Auth + RLS)
- **Routing:** react-router-dom
- **Excel:** librería `xlsx` (solo para importación y plantilla)
- **Auth:** Google OAuth únicamente — sin email/password

---

## Orden de implementación

Seguir el orden del Technical Spec. No saltar pasos.

```
1. Setup del proyecto         → sección 1 del Technical Spec
2. Schema SQL + migraciones   → sección 2
3. RLS policies               → sección 3
4. Seeds de desarrollo        → sección 5
5. Auth (Google OAuth)        → sección 6.2
6. Banco personal             → RF-02, RF-03 + queries sección 4.1 y 4.2
7. Práctica individual        → RF-04, RF-05 + queries sección 4.3
8. Grupos                     → RF-06, RF-07 + queries sección 4.4, 4.5, 4.6
9. Importación Excel          → RF-08 + sección 4.10 y 4.11
10. Sesiones grupales         → RF-09 a RF-11 + queries sección 4.7, 4.8, 4.9
```

---

## Estructura de carpetas

```
src/
  components/       → componentes reutilizables, sin lógica de negocio
  pages/            → una página por ruta
  hooks/            → un hook por entidad o flujo (useWords, useGroup, etc.)
  lib/
    supabase.js           → cliente Supabase (singleton)
    spacedRepetition.js   → calcWeight, selectWeighted, calcNewProgress
    mergeWords.js         → lógica de fusión al unirse a grupo o importar
    importWords.js        → parseImportFile, groupByWord
    sessionRoles.js       → asignación de roles por modo de sesión
  context/
    AuthContext.jsx   → sesión global del usuario
```

Crear archivos en la carpeta correcta. No poner lógica de negocio en componentes ni en páginas.

---

## Reglas de código

**General**
- Usar `async/await` siempre — nunca `.then().catch()`
- Toda llamada a Supabase desestructura `{ data, error }` y verifica `error !== null`
- No usar `localStorage` ni `sessionStorage` — Supabase maneja la sesión
- Nombrar archivos en `PascalCase` para componentes/páginas, `camelCase` para hooks y lib

**Hooks**
- Estructura estándar: `useState` para data, loading y error — ver sección 6.4 del Technical Spec
- Cada hook expone `refetch` para forzar recarga cuando sea necesario

**Supabase**
- Un solo cliente exportado desde `lib/supabase.js` — nunca crear instancias adicionales
- Usar RLS para todo — nunca filtrar por `user_id` en el cliente si RLS ya lo hace
- Las queries principales están documentadas en la sección 4 del Technical Spec — usarlas como referencia, no inventar queries propias sin justificación

**Tailwind**
- No usar clases arbitrarias (`w-[347px]`) salvo que sea estrictamente necesario
- Componentes responsivos por defecto — diseño mobile-first

---

## Reglas de negocio críticas

Estas reglas están en el System Design. No modificarlas sin revisar el documento primero.

**Progreso individual**
- Nivel 0–5 por palabra por usuario
- Sube con 2 aciertos consecutivos (`correct_streak >= 2`) → `level + 1`, streak vuelve a 0
- Baja con 1 fallo → `level - 1` (mínimo 0), streak vuelve a 0
- La lógica está en `lib/spacedRepetition.js` → función `calcNewProgress`

**Selección ponderada**
- `peso = 2^(5 - nivel)` — nivel 0 tiene peso 32, nivel 5 tiene peso 1
- Aplica en práctica individual y en selección de palabras para sesiones grupales
- La lógica está en `lib/spacedRepetition.js` → función `selectWeighted`

**Fusión de palabras**
- Al unirse a un grupo y al importar desde Excel aplica la misma lógica
- Traducción nueva → se añade; ejemplo diferente → se conservan ambos; idéntico → se omite
- La lógica está en `lib/mergeWords.js`

**Sincronización de progreso**
- Solo ocurre al ingresar al grupo, una sola vez
- Toma el nivel del contexto con `last_practiced_at` más reciente
- Nunca se transfiere progreso personal hacia el grupo

**Sesiones grupales**
- Solo una sesión activa por grupo a la vez (garantizado por índice único en DB)
- Modo remoto: máximo 8 horas; modo presencial: sin límite
- Roles por turno: ver sección 3.6 del System Design y `lib/sessionRoles.js`

---

## Variables de entorno

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Siempre usar `import.meta.env.VITE_*` — nunca hardcodear credenciales.

---

## Migraciones

El SQL completo está en la sección 2 del Technical Spec.

```bash
# Crear migración
touch supabase/migrations/20240101000000_initial_schema.sql
# Pegar el SQL del Technical Spec en ese archivo

# Aplicar contra el proyecto remoto
supabase db push
```

No modificar el schema sin crear un nuevo archivo de migración.

---

## Cuándo preguntar antes de actuar

- Si un requerimiento parece contradecirse con otro documento
- Si una query necesita acceder a datos de un usuario diferente al autenticado
- Si se necesita una tabla o campo que no está en el schema
- Si la lógica de un paso de sesión grupal no está clara en el System Design

---

## Lo que NO hacer

- No crear tablas fuera del schema definido sin consultar
- No saltarse la lógica de RLS filtrando manualmente por `user_id` en el cliente
- No mezclar lógica de negocio en componentes de UI
- No usar `useEffect` para mutaciones — solo para lecturas
- No implementar email/password — solo Google OAuth