**SPEC DRIVEN DEVELOPMENT  ·  English Study Group App**

**Fase 4**

**Technical Spec**

|**Proyecto**|English Study Group App|
| :- | :- |
|**Versión**|1\.0 — MVP|
|**Fecha**|19 de marzo de 2026|
|**Depende de**|Fase 3 — System Design / Spec|
|**Base de datos**|PostgreSQL (Supabase)|
|**Convención**|snake\_case|
|**Auth**|Google OAuth únicamente (Supabase Auth)|

# **1. Setup del proyecto**
## **1.1 Requisitos previos**
- Node.js >= 18.x — https://nodejs.org
- npm >= 9.x (incluido con Node.js)
- Supabase CLI — instalación en sección 1.4
- Cuenta en Supabase — https://supabase.com
- Cuenta en Google Cloud Console para OAuth — https://console.cloud.google.com

## **1.2 Crear el proyecto con Vite + React**

|<p># Crear el proyecto</p><p>npm create vite@latest english-study-app -- --template react</p><p>cd english-study-app</p><p></p><p># Instalar dependencias base</p><p>npm install</p><p></p><p># Instalar dependencias del proyecto</p><p>npm install @supabase/supabase-js react-router-dom</p>|
| :- |

## **1.3 Inicializar Git**

|<p>git init</p><p>git add .</p><p>git commit -m "chore: init project"</p>|
| :- |

|Verificar que el .gitignore generado por Vite incluya: node\_modules/, dist/, .env, .env.local|
| :- |

## **1.4 Instalar y configurar Tailwind CSS**

|<p>npm install -D tailwindcss postcss autoprefixer</p><p>npx tailwindcss init -p</p>|
| :- |

|<p>// tailwind.config.js</p><p>export default {</p><p>`  `content: ['./index.html', './src/\*\*/\*.{js,jsx}'],</p><p>`  `theme: { extend: {} },</p><p>`  `plugins: [],</p><p>};</p>|
| :- |

|<p>/\* src/index.css — reemplazar contenido con: \*/</p><p>@tailwind base;</p><p>@tailwind components;</p><p>@tailwind utilities;</p>|
| :- |

## **1.5 Instalar Supabase CLI**

|<p>npm install -g supabase</p><p></p><p># Verificar instalación</p><p>supabase --version</p><p></p><p># Login con tu cuenta de Supabase</p><p>supabase login</p>|
| :- |

## **1.6 Vincular proyecto remoto y configurar migraciones**

|<p># Inicializar estructura de Supabase en el proyecto</p><p>supabase init</p><p></p><p># Vincular con el proyecto remoto</p><p># El project-ref está en Supabase Dashboard → Settings → General</p><p>supabase link --project-ref <project-ref></p><p></p><p># Estructura generada:</p><p># supabase/</p><p>#   migrations/   ← aquí van los archivos SQL</p><p>#   config.toml</p>|
| :- |

## **1.7 Crear y ejecutar migraciones**

|<p># Crear archivo de migración</p><p># Nombrar con timestamp para que Supabase los ejecute en orden</p><p>touch supabase/migrations/20240101000000\_initial\_schema.sql</p><p></p><p># Pegar en ese archivo todo el SQL de la sección 2 de este documento</p><p></p><p># Ejecutar migración contra el proyecto remoto</p><p>supabase db push</p><p></p><p># Verificar en Supabase Dashboard → Table Editor que las tablas existen</p>|
| :- |

|supabase db push aplica todas las migraciones pendientes directamente contra el proyecto remoto. No requiere Docker ni entorno local.|
| :- |

## **1.8 Variables de entorno**

|<p># .env.local — nunca subir a Git</p><p>VITE\_SUPABASE\_URL=https://<project-ref>.supabase.co</p><p>VITE\_SUPABASE\_ANON\_KEY=<anon-key></p><p></p><p># Obtener valores en:</p><p># Supabase Dashboard → Settings → API</p>|
| :- |

## **1.9 Configurar Google OAuth**
- Ir a Google Cloud Console → Crear proyecto → APIs & Services → Credentials
- Crear OAuth 2.0 Client ID → tipo: Web application
- Añadir Authorized redirect URI: https://<project-ref>.supabase.co/auth/v1/callback
- Copiar Client ID y Client Secret
- En Supabase Dashboard → Authentication → Providers → Google → activar y pegar credenciales
- Para desarrollo local añadir también: http://localhost:5173/auth/callback como redirect URI en Google Console

## **1.10 Extensión requerida en PostgreSQL**

|<p>-- Añadir al inicio del archivo de migración (antes de CREATE TABLE)</p><p>CREATE EXTENSION IF NOT EXISTS "pgcrypto";</p>|
| :- |

# **2. Schema SQL completo**

|Ejecutar en orden. Cada bloque es independiente pero respeta dependencias de FK.|
| :- |

## **2.1 Profiles**

|<p>CREATE TABLE profiles (</p><p>`  `id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,</p><p>`  `username       text        NOT NULL UNIQUE,</p><p>`  `avatar\_color   text        NOT NULL DEFAULT '#4F46E5',</p><p>`  `created\_at     timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>-- Trigger: crear perfil automáticamente al registrarse</p><p>-- El nombre viene de Google OAuth: raw\_user\_meta\_data->>'full\_name'</p><p>CREATE OR REPLACE FUNCTION handle\_new\_user()</p><p>RETURNS trigger AS $</p><p>BEGIN</p><p>`  `INSERT INTO profiles (id, username, avatar\_color)</p><p>`  `VALUES (</p><p>`    `NEW.id,</p><p>`    `COALESCE(</p><p>`      `NEW.raw\_user\_meta\_data->>'full\_name',</p><p>`      `NEW.raw\_user\_meta\_data->>'name',</p><p>`      `split\_part(NEW.email, '@', 1)</p><p>`    `),</p><p>`    `'#4F46E5'</p><p>`  `);</p><p>`  `RETURN NEW;</p><p>END;</p><p>$ LANGUAGE plpgsql SECURITY DEFINER;</p><p></p><p>CREATE TRIGGER on\_auth\_user\_created</p><p>`  `AFTER INSERT ON auth.users</p><p>`  `FOR EACH ROW EXECUTE FUNCTION handle\_new\_user();</p>|
| :- |

## **2.2 Words y Word Translations**

|<p>CREATE TABLE words (</p><p>`  `id           uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `word\_en      text        NOT NULL,</p><p>`  `phonetic     text,</p><p>`  `owner\_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,</p><p>`  `status       text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),</p><p>`  `created\_at   timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>CREATE INDEX idx\_words\_owner ON words(owner\_id);</p><p></p><p>CREATE TABLE word\_translations (</p><p>`  `id               uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `word\_id          uuid        NOT NULL REFERENCES words(id) ON DELETE CASCADE,</p><p>`  `translation\_es   text        NOT NULL,</p><p>`  `example\_en       text,</p><p>`  `example\_es       text,</p><p>`  `explanation      text,</p><p>`  `created\_at       timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>CREATE INDEX idx\_word\_translations\_word ON word\_translations(word\_id);</p>|
| :- |

## **2.3 Phrases**

|<p>CREATE TABLE phrases (</p><p>`  `id                   uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `phrase\_en            text        NOT NULL,</p><p>`  `phrase\_es            text        NOT NULL,</p><p>`  `owner\_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,</p><p>`  `word\_translation\_id  uuid        REFERENCES word\_translations(id) ON DELETE SET NULL,</p><p>`  `created\_at           timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>CREATE INDEX idx\_phrases\_owner       ON phrases(owner\_id);</p><p>CREATE INDEX idx\_phrases\_translation ON phrases(word\_translation\_id);</p>|
| :- |

## **2.4 User Word Progress**

|<p>CREATE TABLE user\_word\_progress (</p><p>`  `id                  uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `user\_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,</p><p>`  `word\_id             uuid        NOT NULL REFERENCES words(id) ON DELETE CASCADE,</p><p>`  `level               int         NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 5),</p><p>`  `correct\_streak      int         NOT NULL DEFAULT 0 CHECK (correct\_streak BETWEEN 0 AND 1),</p><p>`  `last\_practiced\_at   timestamptz,</p><p>`  `UNIQUE (user\_id, word\_id)</p><p>);</p><p></p><p>CREATE INDEX idx\_uwp\_user ON user\_word\_progress(user\_id);</p>|
| :- |

## **2.5 Groups y Group Members**

|<p>CREATE TABLE groups (</p><p>`  `id                  uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `name                text        NOT NULL,</p><p>`  `invite\_code         text        NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),</p><p>`  `words\_per\_session   int         NOT NULL DEFAULT 10 CHECK (words\_per\_session > 0),</p><p>`  `created\_by          uuid        NOT NULL REFERENCES profiles(id),</p><p>`  `created\_at          timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>CREATE TABLE group\_members (</p><p>`  `id          uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `group\_id    uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,</p><p>`  `user\_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,</p><p>`  `role        text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),</p><p>`  `joined\_at   timestamptz NOT NULL DEFAULT now(),</p><p>`  `UNIQUE (group\_id, user\_id)</p><p>);</p><p></p><p>CREATE INDEX idx\_group\_members\_user  ON group\_members(user\_id);</p><p>CREATE INDEX idx\_group\_members\_group ON group\_members(group\_id);</p>|
| :- |

## **2.6 Group Words y Group Word Translations**

|<p>CREATE TABLE group\_words (</p><p>`  `id            uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `group\_id      uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,</p><p>`  `word\_en       text        NOT NULL,</p><p>`  `phonetic      text,</p><p>`  `exported\_by   uuid        NOT NULL REFERENCES profiles(id),</p><p>`  `exported\_at   timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>CREATE INDEX idx\_group\_words\_group ON group\_words(group\_id);</p><p></p><p>CREATE TABLE group\_word\_translations (</p><p>`  `id               uuid  PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `group\_word\_id    uuid  NOT NULL REFERENCES group\_words(id) ON DELETE CASCADE,</p><p>`  `translation\_es   text  NOT NULL,</p><p>`  `example\_en       text,</p><p>`  `example\_es       text,</p><p>`  `explanation      text</p><p>);</p><p></p><p>CREATE INDEX idx\_gwt\_word ON group\_word\_translations(group\_word\_id);</p>|
| :- |

## **2.7 Group Phrases**

|<p>CREATE TABLE group\_phrases (</p><p>`  `id                         uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `group\_id                   uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,</p><p>`  `phrase\_en                  text        NOT NULL,</p><p>`  `phrase\_es                  text        NOT NULL,</p><p>`  `group\_word\_translation\_id  uuid        REFERENCES group\_word\_translations(id) ON DELETE SET NULL,</p><p>`  `exported\_by                uuid        NOT NULL REFERENCES profiles(id),</p><p>`  `exported\_at                timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>CREATE INDEX idx\_group\_phrases\_group ON group\_phrases(group\_id);</p>|
| :- |

## **2.8 Group Word Progress**

|<p>CREATE TABLE group\_word\_progress (</p><p>`  `id                  uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `user\_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,</p><p>`  `group\_id            uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,</p><p>`  `group\_word\_id       uuid        NOT NULL REFERENCES group\_words(id) ON DELETE CASCADE,</p><p>`  `level               int         NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 5),</p><p>`  `correct\_streak      int         NOT NULL DEFAULT 0 CHECK (correct\_streak BETWEEN 0 AND 1),</p><p>`  `last\_practiced\_at   timestamptz,</p><p>`  `UNIQUE (user\_id, group\_id, group\_word\_id)</p><p>);</p><p></p><p>CREATE INDEX idx\_gwp\_user  ON group\_word\_progress(user\_id);</p><p>CREATE INDEX idx\_gwp\_group ON group\_word\_progress(group\_id);</p>|
| :- |

## **2.9 Group Sessions**

|<p>CREATE TABLE group\_sessions (</p><p>`  `id            uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `group\_id      uuid        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,</p><p>`  `created\_by    uuid        NOT NULL REFERENCES profiles(id),</p><p>`  `mode          text        NOT NULL CHECK (mode IN ('remote', 'presential')),</p><p>`  `conductor\_id  uuid        REFERENCES profiles(id),</p><p>`  `status        text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),</p><p>`  `word\_count    int         NOT NULL,</p><p>`  `started\_at    timestamptz NOT NULL DEFAULT now(),</p><p>`  `closed\_at     timestamptz,</p><p>`  `CONSTRAINT presential\_requires\_conductor</p><p>`    `CHECK (mode != 'presential' OR conductor\_id IS NOT NULL)</p><p>);</p><p></p><p>CREATE INDEX idx\_sessions\_group  ON group\_sessions(group\_id);</p><p>CREATE INDEX idx\_sessions\_status ON group\_sessions(group\_id, status);</p><p></p><p>-- Solo una sesión activa por grupo a la vez</p><p>CREATE UNIQUE INDEX idx\_one\_active\_session</p><p>`  `ON group\_sessions(group\_id)</p><p>`  `WHERE status = 'active';</p>|
| :- |

## **2.10 Session Attendees**

|<p>CREATE TABLE session\_attendees (</p><p>`  `id           uuid  PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `session\_id   uuid  NOT NULL REFERENCES group\_sessions(id) ON DELETE CASCADE,</p><p>`  `user\_id      uuid  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,</p><p>`  `turn\_order   int   NOT NULL,</p><p>`  `UNIQUE (session\_id, user\_id)</p><p>);</p>|
| :- |

## **2.11 Session Turns**

|<p>CREATE TABLE session\_turns (</p><p>`  `id               uuid  PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `session\_id       uuid  NOT NULL REFERENCES group\_sessions(id) ON DELETE CASCADE,</p><p>`  `group\_word\_id    uuid  NOT NULL REFERENCES group\_words(id),</p><p>`  `turn\_order       int   NOT NULL,</p><p>`  `elector\_id       uuid  REFERENCES profiles(id),</p><p>`  `discoverer\_id    uuid  REFERENCES profiles(id),</p><p>`  `constructor\_id   uuid  REFERENCES profiles(id),</p><p>`  `current\_step     int   NOT NULL DEFAULT 1 CHECK (current\_step BETWEEN 1 AND 4),</p><p>`  `status           text  NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),</p><p>`  `UNIQUE (session\_id, turn\_order)</p><p>);</p><p></p><p>CREATE INDEX idx\_turns\_session ON session\_turns(session\_id);</p>|
| :- |

## **2.12 Session Attempts**

|<p>CREATE TABLE session\_attempts (</p><p>`  `id            uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `turn\_id       uuid        NOT NULL REFERENCES session\_turns(id) ON DELETE CASCADE,</p><p>`  `user\_id       uuid        NOT NULL REFERENCES profiles(id),</p><p>`  `step          int         NOT NULL CHECK (step IN (1, 2)),</p><p>`  `answer        text        NOT NULL,</p><p>`  `is\_correct    boolean     NOT NULL,</p><p>`  `answered\_at   timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>CREATE INDEX idx\_attempts\_turn ON session\_attempts(turn\_id);</p>|
| :- |

## **2.13 Session Submissions y Reviews**

|<p>CREATE TABLE session\_submissions (</p><p>`  `id               uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `turn\_id          uuid        NOT NULL REFERENCES session\_turns(id) ON DELETE CASCADE,</p><p>`  `constructor\_id   uuid        NOT NULL REFERENCES profiles(id),</p><p>`  `phrase\_en        text        NOT NULL,</p><p>`  `approved         boolean,</p><p>`  `created\_at       timestamptz NOT NULL DEFAULT now()</p><p>);</p><p></p><p>CREATE TABLE session\_reviews (</p><p>`  `id              uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `submission\_id   uuid        NOT NULL REFERENCES session\_submissions(id) ON DELETE CASCADE,</p><p>`  `reviewer\_id     uuid        NOT NULL REFERENCES profiles(id),</p><p>`  `approved        boolean     NOT NULL,</p><p>`  `observation     text,</p><p>`  `reviewed\_at     timestamptz NOT NULL DEFAULT now(),</p><p>`  `UNIQUE (submission\_id, reviewer\_id)</p><p>);</p>|
| :- |

## **2.14 Session Turn Confirmations**

|<p>CREATE TABLE session\_turn\_confirmations (</p><p>`  `id             uuid        PRIMARY KEY DEFAULT gen\_random\_uuid(),</p><p>`  `turn\_id        uuid        NOT NULL REFERENCES session\_turns(id) ON DELETE CASCADE,</p><p>`  `user\_id        uuid        NOT NULL REFERENCES profiles(id),</p><p>`  `confirmed\_at   timestamptz NOT NULL DEFAULT now(),</p><p>`  `UNIQUE (turn\_id, user\_id)</p><p>);</p>|
| :- |

# **3. Row Level Security (RLS)**

|Habilitar RLS en todas las tablas antes de añadir policies.|
| :- |

|<p>ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE words                     ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE word\_translations         ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE phrases                   ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE user\_word\_progress        ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE groups                    ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE group\_members             ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE group\_words               ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE group\_word\_translations   ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE group\_phrases             ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE group\_word\_progress       ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE group\_sessions            ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE session\_attendees         ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE session\_turns             ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE session\_attempts          ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE session\_submissions       ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE session\_reviews           ENABLE ROW LEVEL SECURITY;</p><p>ALTER TABLE session\_turn\_confirmations ENABLE ROW LEVEL SECURITY;</p>|
| :- |

## **3.1 Profiles**

|<p>CREATE POLICY profiles\_select ON profiles FOR SELECT</p><p>`  `USING (auth.uid() = id);</p><p></p><p>CREATE POLICY profiles\_update ON profiles FOR UPDATE</p><p>`  `USING (auth.uid() = id);</p>|
| :- |

## **3.2 Words y Word Translations**

|<p>-- Words: solo el dueño</p><p>CREATE POLICY words\_all ON words FOR ALL</p><p>`  `USING (auth.uid() = owner\_id);</p><p></p><p>-- Word translations: accesibles si eres dueño de la palabra</p><p>CREATE POLICY wt\_all ON word\_translations FOR ALL</p><p>`  `USING (EXISTS (</p><p>`    `SELECT 1 FROM words</p><p>`    `WHERE words.id = word\_translations.word\_id</p><p>`    `AND words.owner\_id = auth.uid()</p><p>`  `));</p>|
| :- |

## **3.3 Phrases**

|<p>CREATE POLICY phrases\_all ON phrases FOR ALL</p><p>`  `USING (auth.uid() = owner\_id);</p>|
| :- |

## **3.4 User Word Progress**

|<p>CREATE POLICY uwp\_all ON user\_word\_progress FOR ALL</p><p>`  `USING (auth.uid() = user\_id);</p>|
| :- |

## **3.5 Groups y Group Members**

|<p>-- Helper function: verificar membresía</p><p>CREATE OR REPLACE FUNCTION is\_group\_member(gid uuid)</p><p>RETURNS boolean AS $$</p><p>`  `SELECT EXISTS (</p><p>`    `SELECT 1 FROM group\_members</p><p>`    `WHERE group\_id = gid AND user\_id = auth.uid()</p><p>`  `);</p><p>$$ LANGUAGE sql SECURITY DEFINER;</p><p></p><p>-- Groups: ver si eres miembro, crear siempre</p><p>CREATE POLICY groups\_select ON groups FOR SELECT</p><p>`  `USING (is\_group\_member(id));</p><p></p><p>CREATE POLICY groups\_insert ON groups FOR INSERT</p><p>`  `WITH CHECK (auth.uid() = created\_by);</p><p></p><p>CREATE POLICY groups\_update ON groups FOR UPDATE</p><p>`  `USING (auth.uid() = created\_by);</p><p></p><p>-- Group members: ver y gestionar si eres del grupo</p><p>CREATE POLICY gm\_select ON group\_members FOR SELECT</p><p>`  `USING (is\_group\_member(group\_id));</p><p></p><p>CREATE POLICY gm\_insert ON group\_members FOR INSERT</p><p>`  `WITH CHECK (auth.uid() = user\_id);</p><p></p><p>CREATE POLICY gm\_delete ON group\_members FOR DELETE</p><p>`  `USING (auth.uid() = user\_id);</p>|
| :- |

## **3.6 Group Words, Translations y Phrases**

|<p>CREATE POLICY gw\_select ON group\_words FOR SELECT</p><p>`  `USING (is\_group\_member(group\_id));</p><p></p><p>CREATE POLICY gw\_insert ON group\_words FOR INSERT</p><p>`  `WITH CHECK (is\_group\_member(group\_id));</p><p></p><p>CREATE POLICY gwt\_select ON group\_word\_translations FOR SELECT</p><p>`  `USING (EXISTS (</p><p>`    `SELECT 1 FROM group\_words</p><p>`    `WHERE group\_words.id = group\_word\_translations.group\_word\_id</p><p>`    `AND is\_group\_member(group\_words.group\_id)</p><p>`  `));</p><p></p><p>CREATE POLICY gwt\_insert ON group\_word\_translations FOR INSERT</p><p>`  `WITH CHECK (EXISTS (</p><p>`    `SELECT 1 FROM group\_words</p><p>`    `WHERE group\_words.id = group\_word\_translations.group\_word\_id</p><p>`    `AND is\_group\_member(group\_words.group\_id)</p><p>`  `));</p><p></p><p>CREATE POLICY gp\_select ON group\_phrases FOR SELECT</p><p>`  `USING (is\_group\_member(group\_id));</p><p></p><p>CREATE POLICY gp\_insert ON group\_phrases FOR INSERT</p><p>`  `WITH CHECK (is\_group\_member(group\_id));</p>|
| :- |

## **3.7 Group Word Progress**

|<p>CREATE POLICY gwp\_select ON group\_word\_progress FOR SELECT</p><p>`  `USING (is\_group\_member(group\_id));</p><p></p><p>CREATE POLICY gwp\_insert ON group\_word\_progress FOR INSERT</p><p>`  `WITH CHECK (auth.uid() = user\_id AND is\_group\_member(group\_id));</p><p></p><p>CREATE POLICY gwp\_update ON group\_word\_progress FOR UPDATE</p><p>`  `USING (auth.uid() = user\_id);</p>|
| :- |

## **3.8 Sessions y tablas relacionadas**

|<p>CREATE POLICY gs\_select ON group\_sessions FOR SELECT</p><p>`  `USING (is\_group\_member(group\_id));</p><p></p><p>CREATE POLICY gs\_insert ON group\_sessions FOR INSERT</p><p>`  `WITH CHECK (is\_group\_member(group\_id));</p><p></p><p>CREATE POLICY gs\_update ON group\_sessions FOR UPDATE</p><p>`  `USING (is\_group\_member(group\_id));</p><p></p><p>-- session\_attendees, session\_turns, session\_attempts,</p><p>-- session\_submissions, session\_reviews, session\_turn\_confirmations:</p><p>-- accesibles si eres miembro del grupo de esa sesión</p><p>CREATE OR REPLACE FUNCTION is\_session\_member(sid uuid)</p><p>RETURNS boolean AS $$</p><p>`  `SELECT EXISTS (</p><p>`    `SELECT 1 FROM group\_sessions gs</p><p>`    `JOIN group\_members gm ON gm.group\_id = gs.group\_id</p><p>`    `WHERE gs.id = sid AND gm.user\_id = auth.uid()</p><p>`  `);</p><p>$$ LANGUAGE sql SECURITY DEFINER;</p><p></p><p>CREATE POLICY sa\_all  ON session\_attendees            FOR ALL USING (is\_session\_member(session\_id));</p><p>CREATE POLICY st\_all  ON session\_turns                FOR ALL USING (is\_session\_member(session\_id));</p><p>CREATE POLICY sat\_all ON session\_attempts             FOR ALL USING (EXISTS (SELECT 1 FROM session\_turns WHERE id = turn\_id AND is\_session\_member(session\_id)));</p><p>CREATE POLICY ss\_all  ON session\_submissions          FOR ALL USING (EXISTS (SELECT 1 FROM session\_turns WHERE id = turn\_id AND is\_session\_member(session\_id)));</p><p>CREATE POLICY sr\_all  ON session\_reviews              FOR ALL USING (EXISTS (SELECT 1 FROM session\_submissions ss JOIN session\_turns st ON st.id = ss.turn\_id WHERE ss.id = submission\_id AND is\_session\_member(st.session\_id)));</p><p>CREATE POLICY stc\_all ON session\_turn\_confirmations   FOR ALL USING (EXISTS (SELECT 1 FROM session\_turns WHERE id = turn\_id AND is\_session\_member(session\_id)));</p>|
| :- |

# **4. Queries principales por flujo**
## **4.1 Dashboard — palabras pendientes hoy**

|<p>-- Palabras del banco personal con su nivel, ordenadas por peso descendente</p><p>SELECT</p><p>`  `w.id, w.word\_en, w.phonetic,</p><p>`  `COALESCE(uwp.level, 0)          AS level,</p><p>`  `COALESCE(uwp.correct\_streak, 0) AS correct\_streak,</p><p>`  `POWER(2, 5 - COALESCE(uwp.level, 0)) AS weight</p><p>FROM words w</p><p>LEFT JOIN user\_word\_progress uwp</p><p>`  `ON uwp.word\_id = w.id AND uwp.user\_id = auth.uid()</p><p>WHERE w.owner\_id = auth.uid()</p><p>`  `AND w.status = 'active'</p><p>ORDER BY weight DESC;</p>|
| :- |

## **4.2 Selección ponderada de palabra para práctica**

|<p>-- Selección aleatoria ponderada por nivel (ejecutar en el cliente)</p><p>-- 1. Obtener palabras con pesos (query anterior)</p><p>-- 2. En JS: selección ponderada</p><p></p><p>function selectWeighted(words) {</p><p>`  `const total = words.reduce((sum, w) => sum + w.weight, 0);</p><p>`  `let rand = Math.random() \* total;</p><p>`  `for (const word of words) {</p><p>`    `rand -= word.weight;</p><p>`    `if (rand <= 0) return word;</p><p>`  `}</p><p>`  `return words[words.length - 1];</p><p>}</p>|
| :- |

## **4.3 Actualizar progreso tras práctica**

|<p>-- Acierto</p><p>UPDATE user\_word\_progress SET</p><p>`  `correct\_streak      = CASE WHEN correct\_streak >= 1 THEN 0 ELSE 1 END,</p><p>`  `level               = CASE WHEN correct\_streak >= 1 THEN LEAST(level + 1, 5) ELSE level END,</p><p>`  `last\_practiced\_at   = now()</p><p>WHERE user\_id = auth.uid() AND word\_id = $word\_id;</p><p></p><p>-- Fallo</p><p>UPDATE user\_word\_progress SET</p><p>`  `correct\_streak      = 0,</p><p>`  `level               = GREATEST(level - 1, 0),</p><p>`  `last\_practiced\_at   = now()</p><p>WHERE user\_id = auth.uid() AND word\_id = $word\_id;</p>|
| :- |

## **4.4 Unirse a un grupo — fusión del banco**

|<p>-- 1. Insertar membresía</p><p>INSERT INTO group\_members (group\_id, user\_id, role)</p><p>VALUES ($group\_id, auth.uid(), 'member');</p><p></p><p>-- 2. Obtener palabras del grupo con sus traducciones</p><p>SELECT gw.\*, gwt.\*</p><p>FROM group\_words gw</p><p>JOIN group\_word\_translations gwt ON gwt.group\_word\_id = gw.id</p><p>WHERE gw.group\_id = $group\_id;</p><p></p><p>-- 3. Fusión ejecutada en el cliente (lib/mergeWords.js):</p><p>--    Para cada group\_word:</p><p>--      Buscar coincidencia en words por LOWER(word\_en)</p><p>--      Si no existe: INSERT word + translations + user\_word\_progress(level=0)</p><p>--      Si existe: para cada translation, buscar por LOWER(translation\_es)</p><p>--        Si no existe: INSERT word\_translation</p><p>--        Si existe y example\_en difiere: INSERT nueva word\_translation</p><p>--        Si es idéntico: omitir</p><p></p><p>-- 4. Crear group\_word\_progress nivel 0 para el nuevo miembro</p><p>INSERT INTO group\_word\_progress (user\_id, group\_id, group\_word\_id, level, correct\_streak)</p><p>SELECT auth.uid(), $group\_id, gw.id, 0, 0</p><p>FROM group\_words gw</p><p>WHERE gw.group\_id = $group\_id</p><p>ON CONFLICT (user\_id, group\_id, group\_word\_id) DO NOTHING;</p>|
| :- |

## **4.5 Sincronización de progreso al ingresar al grupo**

|<p>-- Ejecutar si el usuario acepta sincronizar</p><p>-- Toma el nivel del contexto con last\_practiced\_at más reciente</p><p>UPDATE user\_word\_progress uwp SET</p><p>`  `level             = gwp.level,</p><p>`  `correct\_streak    = gwp.correct\_streak,</p><p>`  `last\_practiced\_at = gwp.last\_practiced\_at</p><p>FROM group\_word\_progress gwp</p><p>JOIN group\_words gw ON gw.id = gwp.group\_word\_id</p><p>JOIN words w ON LOWER(w.word\_en) = LOWER(gw.word\_en)</p><p>WHERE gwp.group\_id   = $group\_id</p><p>`  `AND gwp.user\_id    = auth.uid()</p><p>`  `AND uwp.user\_id    = auth.uid()</p><p>`  `AND uwp.word\_id    = w.id</p><p>`  `AND gwp.last\_practiced\_at > COALESCE(uwp.last\_practiced\_at, '1970-01-01');</p>|
| :- |

## **4.6 Exportar palabra al grupo**

|<p>-- 1. Insertar copia en group\_words</p><p>INSERT INTO group\_words (group\_id, word\_en, phonetic, exported\_by)</p><p>SELECT $group\_id, word\_en, phonetic, auth.uid()</p><p>FROM words WHERE id = $word\_id</p><p>RETURNING id AS new\_group\_word\_id;</p><p></p><p>-- 2. Copiar traducciones</p><p>INSERT INTO group\_word\_translations</p><p>`  `(group\_word\_id, translation\_es, example\_en, example\_es, explanation)</p><p>SELECT $new\_group\_word\_id, translation\_es, example\_en, example\_es, explanation</p><p>FROM word\_translations WHERE word\_id = $word\_id;</p><p></p><p>-- 3. Crear progreso nivel 0 para todos los miembros actuales</p><p>INSERT INTO group\_word\_progress (user\_id, group\_id, group\_word\_id, level, correct\_streak)</p><p>SELECT gm.user\_id, $group\_id, $new\_group\_word\_id, 0, 0</p><p>FROM group\_members gm WHERE gm.group\_id = $group\_id</p><p>ON CONFLICT DO NOTHING;</p>|
| :- |

## **4.7 Crear sesión grupal**

|<p>-- Verificar que no haya sesión activa</p><p>SELECT id FROM group\_sessions</p><p>WHERE group\_id = $group\_id AND status = 'active';</p><p>-- Si retorna filas: bloquear la creación</p><p></p><p>-- Crear sesión</p><p>INSERT INTO group\_sessions</p><p>`  `(group\_id, created\_by, mode, conductor\_id, word\_count)</p><p>VALUES</p><p>`  `($group\_id, auth.uid(), $mode, $conductor\_id, $word\_count)</p><p>RETURNING id;</p><p></p><p>-- Seleccionar palabras para la sesión (ponderado por nivel promedio del grupo)</p><p>SELECT</p><p>`  `gw.id, gw.word\_en,</p><p>`  `AVG(COALESCE(gwp.level, 0)) AS avg\_level,</p><p>`  `POWER(2, 5 - AVG(COALESCE(gwp.level, 0))::int) AS weight</p><p>FROM group\_words gw</p><p>LEFT JOIN group\_word\_progress gwp ON gwp.group\_word\_id = gw.id</p><p>WHERE gw.group\_id = $group\_id</p><p>GROUP BY gw.id, gw.word\_en</p><p>ORDER BY weight DESC;</p><p>-- Aplicar selección ponderada en cliente para elegir $word\_count palabras</p>|
| :- |

## **4.8 Registrar intento en sesión**

|<p>-- Insertar intento (paso 1 o 2)</p><p>INSERT INTO session\_attempts (turn\_id, user\_id, step, answer, is\_correct)</p><p>VALUES ($turn\_id, auth.uid(), $step, $answer, $is\_correct);</p><p></p><p>-- Si es correcto y es paso 1: actualizar discoverer\_id en el turno</p><p>UPDATE session\_turns SET discoverer\_id = auth.uid()</p><p>WHERE id = $turn\_id AND discoverer\_id IS NULL AND $step = 1 AND $is\_correct = true;</p><p></p><p>-- Actualizar progreso grupal de la palabra</p><p>UPDATE group\_word\_progress SET</p><p>`  `correct\_streak    = CASE WHEN $is\_correct AND correct\_streak >= 1 THEN 0 ELSE</p><p>`                      `CASE WHEN $is\_correct THEN 1 ELSE 0 END END,</p><p>`  `level             = CASE WHEN $is\_correct AND correct\_streak >= 1 THEN LEAST(level+1,5)</p><p>`                      `WHEN NOT $is\_correct THEN GREATEST(level-1,0) ELSE level END,</p><p>`  `last\_practiced\_at = now()</p><p>WHERE user\_id = auth.uid()</p><p>`  `AND group\_word\_id = (SELECT group\_word\_id FROM session\_turns WHERE id = $turn\_id);</p>|
| :- |

## **4.9 Resumen final de sesión**

|<p>SELECT</p><p>`  `st.id AS turn\_id,</p><p>`  `gw.word\_en,</p><p>`  `COUNT(sa.id) FILTER (WHERE sa.is\_correct AND sa.step = 2) AS correct\_translations,</p><p>`  `COUNT(DISTINCT sa.user\_id) FILTER (WHERE sa.step = 2)     AS total\_translators,</p><p>`  `ss.approved                                                AS phrase\_approved</p><p>FROM session\_turns st</p><p>JOIN group\_words gw ON gw.id = st.group\_word\_id</p><p>LEFT JOIN session\_attempts sa ON sa.turn\_id = st.id</p><p>LEFT JOIN session\_submissions ss ON ss.turn\_id = st.id</p><p>WHERE st.session\_id = $session\_id</p><p>GROUP BY st.id, gw.word\_en, ss.approved</p><p>ORDER BY st.turn\_order;</p>|
| :- |


## **4.10 Importación desde Excel**

|<p>// lib/importWords.js</p><p>// Dependencia: npm install xlsx</p><p>import \* as XLSX from 'xlsx';</p><p></p><p>// 1. Leer archivo y convertir a JSON</p><p>export function parseImportFile(file) {</p><p>`  `return new Promise((resolve) => {</p><p>`    `const reader = new FileReader();</p><p>`    `reader.onload = (e) => {</p><p>`      `const wb = XLSX.read(e.target.result, { type: 'binary' });</p><p>`      `const ws = wb.Sheets[wb.SheetNames[0]];</p><p>`      `const rows = XLSX.utils.sheet\_to\_json(ws, { defval: '' });</p><p>`      `resolve(rows);</p><p>`    `};</p><p>`    `reader.readAsBinaryString(file);</p><p>`  `});</p><p>}</p><p></p><p>// 2. Agrupar filas por word\_en</p><p>export function groupByWord(rows) {</p><p>`  `const map = {};</p><p>`  `for (const row of rows) {</p><p>`    `const key = row.word\_en?.trim().toLowerCase();</p><p>`    `if (!key || !row.translation\_es?.trim()) continue; // omitir filas inválidas</p><p>`    `if (!map[key]) map[key] = { word\_en: row.word\_en.trim(),</p><p>`      `phonetic: row.phonetic?.trim() || null, translations: [] };</p><p>`    `map[key].translations.push({</p><p>`      `translation\_es: row.translation\_es.trim(),</p><p>`      `example\_en:     row.example\_en?.trim()    || null,</p><p>`      `example\_es:     row.example\_es?.trim()    || null,</p><p>`      `explanation:    row.explanation?.trim()   || null,</p><p>`    `});</p><p>`  `}</p><p>`  `return Object.values(map);</p><p>}</p><p></p><p>// 3. Fusionar con banco personal (misma lógica que mergeWords.js)</p><p>// Para cada word del grupo parseado:</p><p>//   Buscar coincidencia en words personal por LOWER(word\_en)</p><p>//   Si no existe → INSERT word + translations + user\_word\_progress(level=0)</p><p>//   Si existe → fusionar traducciones (ver sección 3.5 del System Design)</p>|
| :- |

## **4.11 Plantilla Excel descargable**

|<p>// Generar y descargar plantilla desde el cliente</p><p>import \* as XLSX from 'xlsx';</p><p></p><p>export function downloadTemplate() {</p><p>`  `const headers = [</p><p>`    `'word\_en', 'phonetic', 'translation\_es',</p><p>`    `'example\_en', 'example\_es', 'explanation'</p><p>`  `];</p><p>`  `const examples = [</p><p>`    `['run',  '/rʌn/', 'correr',   'She runs every morning.',</p><p>`     `'Ella corre cada mañana.', 'Uso físico, movimiento.'],</p><p>`    `['run',  '/rʌn/', 'ejecutar', 'Run the program again.',</p><p>`     `'Ejecuta el programa de nuevo.', 'Uso técnico.'],</p><p>`    `['bold', '',      'audaz',    'He made a bold decision.',</p><p>`     `'Tomó una decisión audaz.', 'Describe valentía o atrevimiento.'],</p><p>`  `];</p><p>`  `const ws = XLSX.utils.aoa\_to\_sheet([headers, ...examples]);</p><p>`  `const wb = XLSX.utils.book\_new();</p><p>`  `XLSX.utils.book\_append\_sheet(wb, ws, 'Palabras');</p><p>`  `XLSX.writeFile(wb, 'plantilla\_palabras.xlsx');</p><p>}</p><p></p><p>// Columnas obligatorias: word\_en, translation\_es</p><p>// Columnas opcionales:   phonetic, example\_en, example\_es, explanation</p>|
| :- |

# **5. Seeds de desarrollo**

|Insertar después de crear al menos un usuario desde el cliente. Reemplazar los UUIDs de ejemplo con los reales del auth.users.|
| :- |

## **5.1 Palabras de ejemplo**

|<p>-- Asumir que el usuario de desarrollo tiene id: '<user-uuid>'</p><p></p><p>INSERT INTO words (id, word\_en, phonetic, owner\_id) VALUES</p><p>`  `('word-001', 'ephemeral',  '/ɪˈfem.ər.əl/', '<user-uuid>'),</p><p>`  `('word-002', 'resilient',  '/rɪˈzɪl.i.ənt/', '<user-uuid>'),</p><p>`  `('word-003', 'ambiguous',  '/æmˈbɪɡ.ju.əs/', '<user-uuid>'),</p><p>`  `('word-004', 'meticulous', '/məˈtɪk.jə.ləs/', '<user-uuid>'),</p><p>`  `('word-005', 'eloquent',   '/ˈel.ə.kwənt/',  '<user-uuid>');</p><p></p><p>INSERT INTO word\_translations</p><p>`  `(word\_id, translation\_es, example\_en, example\_es, explanation) VALUES</p><p>`  `('word-001', 'efímero',    'That ephemeral moment stayed with me forever.',</p><p>`               `'Ese momento efímero se quedó conmigo para siempre.',</p><p>`               `'Describe algo que dura muy poco tiempo.'),</p><p>`  `('word-002', 'resiliente', 'She is resilient in the face of adversity.',</p><p>`               `'Ella es resiliente ante la adversidad.',</p><p>`               `'Capacidad de recuperarse de dificultades.'),</p><p>`  `('word-003', 'ambiguo',    'His answer was deliberately ambiguous.',</p><p>`               `'Su respuesta fue deliberadamente ambigua.',</p><p>`               `'Que puede interpretarse de más de una manera.'),</p><p>`  `('word-004', 'meticuloso', 'She is meticulous about her work.',</p><p>`               `'Ella es meticulosa con su trabajo.',</p><p>`               `'Extremadamente cuidadoso con los detalles.'),</p><p>`  `('word-005', 'elocuente',  'He gave an eloquent speech at the ceremony.',</p><p>`               `'Dio un discurso elocuente en la ceremonia.',</p><p>`               `'Fluido y persuasivo al hablar o escribir.');</p>|
| :- |

## **5.2 Progreso inicial variado**

|<p>INSERT INTO user\_word\_progress</p><p>`  `(user\_id, word\_id, level, correct\_streak, last\_practiced\_at) VALUES</p><p>`  `('<user-uuid>', 'word-001', 0, 0, null),</p><p>`  `('<user-uuid>', 'word-002', 2, 1, now() - interval '2 days'),</p><p>`  `('<user-uuid>', 'word-003', 1, 0, now() - interval '5 days'),</p><p>`  `('<user-uuid>', 'word-004', 4, 0, now() - interval '1 day'),</p><p>`  `('<user-uuid>', 'word-005', 5, 0, now() - interval '10 days');</p>|
| :- |

## **5.3 Grupo de ejemplo**

|<p>INSERT INTO groups (id, name, invite\_code, words\_per\_session, created\_by) VALUES</p><p>`  `('group-001', 'English Study Group', 'ABC12345', 5, '<user-uuid>');</p><p></p><p>INSERT INTO group\_members (group\_id, user\_id, role) VALUES</p><p>`  `('group-001', '<user-uuid>', 'owner');</p><p></p><p>-- Exportar word-001 al grupo</p><p>INSERT INTO group\_words (id, group\_id, word\_en, phonetic, exported\_by) VALUES</p><p>`  `('gw-001', 'group-001', 'ephemeral', '/ɪˈfem.ər.əl/', '<user-uuid>');</p><p></p><p>INSERT INTO group\_word\_translations</p><p>`  `(group\_word\_id, translation\_es, example\_en, example\_es, explanation) VALUES</p><p>`  `('gw-001', 'efímero', 'That ephemeral moment stayed with me forever.',</p><p>`   `'Ese momento efímero se quedó conmigo para siempre.',</p><p>`   `'Describe algo que dura muy poco tiempo.');</p><p></p><p>INSERT INTO group\_word\_progress (user\_id, group\_id, group\_word\_id, level) VALUES</p><p>`  `('<user-uuid>', 'group-001', 'gw-001', 0);</p>|
| :- |

# **6. Convenciones de código**
## **6.1 Cliente Supabase**

|<p>// lib/supabase.js</p><p>import { createClient } from '@supabase/supabase-js';</p><p></p><p>export const supabase = createClient(</p><p>`  `import.meta.env.VITE\_SUPABASE\_URL,</p><p>`  `import.meta.env.VITE\_SUPABASE\_ANON\_KEY</p><p>);</p>|
| :- |

## **6.2 Autenticación con Google OAuth**

|<p>// Login con Google</p><p>await supabase.auth.signInWithOAuth({</p><p>`  `provider: 'google',</p><p>`  `options: {</p><p>`    `redirectTo: window.location.origin + '/auth/callback'</p><p>`  `}</p><p>});</p><p></p><p>// Callback — src/pages/AuthCallback.jsx</p><p>// Supabase maneja el token automáticamente al regresar de Google</p><p>// Solo redirigir al dashboard si hay sesión activa:</p><p>const { data: { session } } = await supabase.auth.getSession();</p><p>if (session) navigate('/dashboard');</p><p>else navigate('/login');</p><p></p><p>// Cerrar sesión</p><p>await supabase.auth.signOut();</p>|
| :- |

## **6.3 Manejo de errores**
- Toda llamada a Supabase debe desestructurar { data, error }
- Si error !== null → mostrar mensaje al usuario y loguear en consola
- No usar .then().catch() — usar async/await en todos los hooks

## **6.4 Hooks — estructura estándar**

|<p>// Estructura base de cualquier hook</p><p>export function useWords() {</p><p>`  `const [words, setWords] = useState([]);</p><p>`  `const [loading, setLoading] = useState(true);</p><p>`  `const [error, setError] = useState(null);</p><p></p><p>`  `async function fetchWords() {</p><p>`    `setLoading(true);</p><p>`    `const { data, error } = await supabase</p><p>      .from('words')</p><p>      .select('\*, word\_translations(\*)')</p><p>      .eq('status', 'active');</p><p>`    `if (error) { setError(error.message); }</p><p>`    `else { setWords(data); }</p><p>`    `setLoading(false);</p><p>`  `}</p><p></p><p>`  `useEffect(() => { fetchWords(); }, []);</p><p>`  `return { words, loading, error, refetch: fetchWords };</p><p>}</p>|
| :- |

## **6.5 Lógica de spaced repetition — lib/spacedRepetition.js**

|<p>export function calcWeight(level) {</p><p>`  `return Math.pow(2, 5 - level); // nivel 0 = 32, nivel 5 = 1</p><p>}</p><p></p><p>export function selectWeighted(words) {</p><p>`  `const total = words.reduce((s, w) => s + calcWeight(w.level), 0);</p><p>`  `let rand = Math.random() \* total;</p><p>`  `for (const word of words) {</p><p>`    `rand -= calcWeight(word.level);</p><p>`    `if (rand <= 0) return word;</p><p>`  `}</p><p>`  `return words[words.length - 1];</p><p>}</p><p></p><p>export function calcNewProgress(current, isCorrect) {</p><p>`  `if (isCorrect) {</p><p>`    `const newStreak = current.correct\_streak + 1;</p><p>`    `return newStreak >= 2</p><p>`      `? { level: Math.min(current.level + 1, 5), correct\_streak: 0 }</p><p>`      `: { level: current.level, correct\_streak: newStreak };</p><p>`  `}</p><p>`  `return { level: Math.max(current.level - 1, 0), correct\_streak: 0 };</p><p>}</p>|
| :- |


English Study Group App  ·  Fase 4: Technical Spec  ·  v1.0
