**SPEC DRIVEN DEVELOPMENT  ·  English Study Group App**

**Fase 3**

**System Design / Spec**

|**Proyecto**|English Study Group App|
| :- | :- |
|**Versión**|1\.0 — MVP|
|**Fecha**|19 de marzo de 2026|
|**Depende de**|Fase 2 — Requirements|

# **1. Arquitectura general**

|<p>Frontend          React + Vite</p><p>Estilos           Tailwind CSS</p><p>Base de datos     Supabase — PostgreSQL</p><p>Autenticación     Supabase Auth (usuarios pre-creados por admin)</p><p>Seguridad         Row Level Security (RLS) en todas las tablas</p><p>Configuración     Variables de entorno .env (VITE\_SUPABASE\_URL, VITE\_SUPABASE\_ANON\_KEY)</p>|
| :- |

La app es un SPA (Single Page Application). Los usuarios son creados y gestionados por un administrador desde Supabase Dashboard. Los usuarios finales solo seleccionan su perfil para iniciar sesión.

Todo el estado de sesión de práctica grupal se persiste en Supabase — no se necesita WebSockets porque la mecánica es asíncrona. Los clientes consultan el estado actual al entrar a cada paso.

# **2. Modelo de datos**
Todas las tablas incluyen RLS. Las claves primarias son UUID generados por Supabase.

## **2.1 Usuarios**

|<p>profiles</p><p>`  `id               uuid  PK  (references auth.users)</p><p>`  `username         text  NOT NULL UNIQUE</p><p>`  `avatar\_color     text  NOT NULL</p><p>`  `created\_at       timestamptz DEFAULT now()</p><p></p><p>**Flujo de autenticación:**</p><p>1. Admin crea usuarios en Supabase Dashboard → Authentication → Users</p><p>2. Admin configura username y avatar_color en tabla profiles</p><p>3. Usuario accede a la app e ingresa su email</p><p>4. La app usa signInWithOtp para enviar enlace mágico (magic link) al email</p><p>5. Usuario hace clic en el enlace y accede automáticamente a la app</p><p>6. El admin proporciona a cada usuario su email de acceso</p>|
| :- |

## **2.2 Banco de palabras personal**

|<p>words</p><p>`  `id               uuid  PK</p><p>`  `word\_en          text  NOT NULL</p><p>`  `phonetic         text</p><p>`  `owner\_id         uuid  FK → profiles.id</p><p>`  `status           text  DEFAULT 'active'   -- active | archived</p><p>`  `created\_at       timestamptz DEFAULT now()</p><p></p><p>word\_translations</p><p>`  `id               uuid  PK</p><p>`  `word\_id          uuid  FK → words.id  ON DELETE CASCADE</p><p>`  `translation\_es   text  NOT NULL</p><p>`  `example\_en       text</p><p>`  `example\_es       text</p><p>`  `explanation      text</p><p>`  `created\_at       timestamptz DEFAULT now()</p>|
| :- |

## **2.3 Banco de frases personal**

|<p>phrases</p><p>`  `id                   uuid  PK</p><p>`  `phrase\_en            text  NOT NULL</p><p>`  `phrase\_es            text  NOT NULL</p><p>`  `owner\_id             uuid  FK → profiles.id</p><p>`  `word\_translation\_id  uuid  FK → word\_translations.id  ON DELETE CASCADE</p><p>`  `created\_at           timestamptz DEFAULT now()</p>|
| :- |

## **2.4 Progreso individual**

|<p>user\_word\_progress</p><p>`  `id                   uuid  PK</p><p>`  `user\_id              uuid  FK → profiles.id</p><p>`  `word\_id              uuid  FK → words.id</p><p>`  `level                int   DEFAULT 0   -- 0 a 5</p><p>`  `correct\_streak       int   DEFAULT 0   -- 0 o 1</p><p>`  `last\_practiced\_at    timestamptz</p><p>`  `UNIQUE (user\_id, word\_id)</p>|
| :- |

## **2.5 Grupos**

|<p>groups</p><p>`  `id               uuid  PK</p><p>`  `name             text  NOT NULL</p><p>`  `invite\_code      text  NOT NULL UNIQUE</p><p>`  `words\_per\_session int  NOT NULL DEFAULT 10</p><p>`  `created\_by       uuid  FK → profiles.id</p><p>`  `created\_at       timestamptz DEFAULT now()</p><p></p><p>group\_members</p><p>`  `id               uuid  PK</p><p>`  `group\_id         uuid  FK → groups.id  ON DELETE CASCADE</p><p>`  `user\_id          uuid  FK → profiles.id</p><p>`  `role             text  DEFAULT 'member'  -- owner | member</p><p>`  `joined\_at        timestamptz DEFAULT now()</p><p>`  `UNIQUE (group\_id, user\_id)</p>|
| :- |

## **2.6 Banco de palabras del grupo**

|<p>group\_words   -- copia independiente exportada al grupo</p><p>`  `id               uuid  PK</p><p>`  `group\_id         uuid  FK → groups.id  ON DELETE CASCADE</p><p>`  `word\_en          text  NOT NULL</p><p>`  `phonetic         text</p><p>`  `exported\_by      uuid  FK → profiles.id</p><p>`  `exported\_at      timestamptz DEFAULT now()</p><p></p><p>group\_word\_translations</p><p>`  `id               uuid  PK</p><p>`  `group\_word\_id    uuid  FK → group\_words.id  ON DELETE CASCADE</p><p>`  `translation\_es   text  NOT NULL</p><p>`  `example\_en       text</p><p>`  `example\_es       text</p><p>`  `explanation      text</p><p></p><p>group\_phrases   -- copia independiente</p><p>`  `id                           uuid  PK</p><p>`  `group\_id                     uuid  FK → groups.id  ON DELETE CASCADE</p><p>`  `phrase\_en                    text  NOT NULL</p><p>`  `phrase\_es                    text  NOT NULL</p><p>`  `group\_word\_translation\_id    uuid  FK → group\_word\_translations.id  ON DELETE CASCADE</p><p>`  `exported\_by                  uuid  FK → profiles.id</p><p>`  `exported\_at                  timestamptz DEFAULT now()</p>|
| :- |

## **2.7 Progreso grupal**

|<p>group\_word\_progress</p><p>`  `id                   uuid  PK</p><p>`  `user\_id              uuid  FK → profiles.id</p><p>`  `group\_id             uuid  FK → groups.id</p><p>`  `group\_word\_id        uuid  FK → group\_words.id</p><p>`  `level                int   DEFAULT 0   -- 0 a 5</p><p>`  `correct\_streak       int   DEFAULT 0   -- 0 o 1</p><p>`  `last\_practiced\_at    timestamptz</p><p>`  `UNIQUE (user\_id, group\_id, group\_word\_id)</p>|
| :- |

## **2.8 Sesiones grupales**

|<p>group\_sessions</p><p>`  `id               uuid  PK</p><p>`  `group\_id         uuid  FK → groups.id  ON DELETE CASCADE</p><p>`  `created\_by       uuid  FK → profiles.id</p><p>`  `mode             text  NOT NULL   -- remote | presential</p><p>`  `conductor\_id     uuid  FK → profiles.id  NULLABLE  -- solo presencial</p><p>`  `status           text  DEFAULT 'active'  -- active | closed</p><p>`  `started\_at       timestamptz DEFAULT now()</p><p>`  `closed\_at        timestamptz</p><p>`  `word\_count       int   NOT NULL</p><p></p><p>session\_turns   -- un turno por palabra</p><p>`  `id               uuid  PK</p><p>`  `session\_id       uuid  FK → group\_sessions.id  ON DELETE CASCADE</p><p>`  `group\_word\_id    uuid  FK → group\_words.id</p><p>`  `turn\_order       int   NOT NULL</p><p>`  `elector\_id       uuid  FK → profiles.id  NULLABLE  -- NULL en modo presencial</p><p>`  `discoverer\_id    uuid  FK → profiles.id  NULLABLE</p><p>`  `constructor\_id   uuid  FK → profiles.id</p><p>`  `current\_step     int   DEFAULT 1   -- 1 | 2 | 3 | 4 (cierre)</p><p>`  `status           text  DEFAULT 'active'  -- active | closed</p><p></p><p>session\_attempts   -- intentos de pasos 1 y 2</p><p>`  `id               uuid  PK</p><p>`  `turn\_id          uuid  FK → session\_turns.id  ON DELETE CASCADE</p><p>`  `user\_id          uuid  FK → profiles.id</p><p>`  `step             int   NOT NULL   -- 1 | 2</p><p>`  `answer           text  NOT NULL</p><p>`  `is\_correct       boolean NOT NULL</p><p>`  `answered\_at      timestamptz DEFAULT now()</p><p></p><p>session\_submissions   -- frase construida en paso 3</p><p>`  `id               uuid  PK</p><p>`  `turn\_id          uuid  FK → session\_turns.id  ON DELETE CASCADE</p><p>`  `constructor\_id   uuid  FK → profiles.id</p><p>`  `phrase\_en        text  NOT NULL</p><p>`  `approved         boolean</p><p>`  `created\_at       timestamptz DEFAULT now()</p><p></p><p>session\_reviews   -- calificaciones de la frase del paso 3</p><p>`  `id               uuid  PK</p><p>`  `submission\_id    uuid  FK → session\_submissions.id  ON DELETE CASCADE</p><p>`  `reviewer\_id      uuid  FK → profiles.id</p><p>`  `approved         boolean NOT NULL</p><p>`  `observation      text</p><p>`  `reviewed\_at      timestamptz DEFAULT now()</p><p></p><p>session\_turn\_confirmations   -- cierre del turno (solo remoto)</p><p>`  `id               uuid  PK</p><p>`  `turn\_id          uuid  FK → session\_turns.id  ON DELETE CASCADE</p><p>`  `user\_id          uuid  FK → profiles.id</p><p>`  `confirmed\_at     timestamptz DEFAULT now()</p><p>`  `UNIQUE (turn\_id, user\_id)</p><p></p><p>session\_attendees   -- asistentes confirmados en sesión presencial</p><p>`  `id               uuid  PK</p><p>`  `session\_id       uuid  FK → group\_sessions.id  ON DELETE CASCADE</p><p>`  `user\_id          uuid  FK → profiles.id</p><p>`  `turn\_order       int   NOT NULL</p><p>`  `UNIQUE (session\_id, user\_id)</p>|
| :- |

# **3. Reglas de negocio**
## **3.1 Selección de palabras — práctica individual y sesiones grupales**

|<p>peso(nivel) = 2^(5 - nivel)</p><p></p><p>nivel 0 → peso 32    nivel 3 → peso 4</p><p>nivel 1 → peso 16    nivel 4 → peso 2</p><p>nivel 2 → peso 8     nivel 5 → peso 1</p><p></p><p>probabilidad(palabra\_i) = peso(nivel\_i) / Σ pesos</p><p></p><p>Aplica en:</p><p>`  `— Práctica individual: sobre user\_word\_progress.level</p><p>`  `— Sesión grupal remota: el elector elige, pero el sistema puede sugerir</p><p>`    `usando group\_word\_progress.level del grupo</p><p>`  `— Sesión grupal presencial: el sistema siempre elige</p><p>`    `usando group\_word\_progress.level promedio del grupo</p>|
| :- |

## **3.2 Avance y retroceso de nivel**

|<p>ACIERTO:</p><p>`  `correct\_streak = correct\_streak + 1</p><p>`  `SI correct\_streak >= 2:</p><p>`    `level = MIN(level + 1, 5)</p><p>`    `correct\_streak = 0</p><p></p><p>FALLO:</p><p>`  `level = MAX(level - 1, 0)</p><p>`  `correct\_streak = 0</p>|
| :- |

## **3.3 Sincronización de progreso**

|<p>PARA CADA palabra practicada en el grupo:</p><p>`  `gwp = group\_word\_progress (nivel y last\_practiced\_at grupal)</p><p>`  `uwp = user\_word\_progress  (nivel y last\_practiced\_at personal)</p><p></p><p>`  `SI gwp.last\_practiced\_at > uwp.last\_practiced\_at:</p><p>`    `uwp.level = gwp.level</p><p>`    `uwp.correct\_streak = gwp.correct\_streak</p><p>`  `SI NO:</p><p>`    `uwp no cambia</p><p></p><p>`  `El grupo NUNCA recibe datos del progreso personal.</p>|
| :- |

## **3.4 Cambio y abandono de grupo**

|<p>SI usuario ya pertenece a grupo A e intenta unirse a grupo B:</p><p>`  `→ Preguntar: '¿Deseas abandonar el grupo A para unirte al grupo B?'</p><p>`  `SI acepta:</p><p>`    `→ Eliminar registro en group\_members para grupo A</p><p>`    `→ Crear registro en group\_members para grupo B</p><p>`    `→ Ejecutar fusión del banco del grupo B (ver 3.5)</p><p>`    `→ Preguntar sincronización de progreso (ver 3.3)</p><p>`  `SI rechaza:</p><p>`    `→ No ocurre ningún cambio</p><p></p><p>Las palabras descargadas del grupo A permanecen en el banco personal</p><p>sin importar si el usuario abandona el grupo.</p>|
| :- |

## **3.5 Fusión al unirse a un grupo**

|<p>PARA CADA group\_word en el grupo:</p><p>`  `Buscar coincidencia en words personal por word\_en (case-insensitive)</p><p></p><p>`  `SI no existe → crear word + word\_translations + user\_word\_progress(level=0)</p><p></p><p>`  `SI existe:</p><p>`    `PARA CADA group\_word\_translation:</p><p>`      `Buscar coincidencia por translation\_es (case-insensitive)</p><p>`      `SI no existe → añadir nueva word\_translation</p><p>`      `SI existe:</p><p>`        `SI example\_en del grupo ≠ example\_en personal → conservar ambos</p><p>`          `(se añade nueva word\_translation con mismo translation\_es)</p><p>`        `SI son idénticos → omitir</p><p></p><p>`  `SIEMPRE crear group\_word\_progress(level=0) para el nuevo miembro</p>|
| :- |

## **3.6 Asignación de roles en sesión grupal**

|<p>── MODO REMOTO ──────────────────────────────────────────</p><p>miembros\_activos = lista de miembros del grupo (aleatorizado por turno)</p><p></p><p>Rol A (Elector)      = miembros\_activos[0]</p><p>Rol B (Descubridor)  = quien responda primero correctamente en paso 1</p><p>`                       `NULL si nadie acierta</p><p>candidatos\_constructor = miembros\_activos - Rol A - Rol B - Rol C</p><p></p><p>SI len(miembros) == 3:  Rol D = Rol A</p><p>SI len(miembros) == 4:  Rol D = el único candidato sobrante</p><p>SI len(miembros) >= 5:  Rol D = random.choice(candidatos\_constructor)</p><p></p><p>── MODO PRESENCIAL ──────────────────────────────────────</p><p>asistentes = session\_attendees ordenados por turn\_order</p><p>turn\_start\_index rota por palabra (siguiente al último que intentó)</p><p></p><p>Rol A no existe — el sistema elige la palabra</p><p>Rol B (Descubridor)  = primer asistente en acertar en paso 1</p><p>`                       `NULL si nadie acierta</p><p>candidatos\_constructor = asistentes - Rol B - Rol C</p><p></p><p>SI len(asistentes) == 3:  Rol D = quien no fue B ni C</p><p>SI len(asistentes) == 4:  Rol D = el único candidato sobrante</p><p>SI len(asistentes) >= 5:  Rol D = random.choice(candidatos\_constructor)</p>|
| :- |

## **3.7 Cierre automático de sesión**

|<p>Una sesión se cierra cuando:</p><p>`  `a) Se completan los X turnos (todas las palabras)</p><p>`  `b) SOLO REMOTO: han transcurrido 8 horas desde started\_at</p><p></p><p>Al cerrar:</p><p>`  `group\_sessions.status = 'closed'</p><p>`  `group\_sessions.closed\_at = now()</p><p>`  `Se calculan estadísticas para el resumen</p>|
| :- |

# **4. Estructura de carpetas**

|<p>src/</p><p>`  `components/</p><p>`    `WordCard.jsx</p><p>`    `TranslationForm.jsx</p><p>`    `QuizOption.jsx</p><p>`    `ProgressBar.jsx</p><p>`    `PhraseReview.jsx</p><p>`    `SessionTurn.jsx</p><p>`  `pages/</p><p>`    `Login.jsx</p><p>`    `Dashboard.jsx</p><p>`    `WordBank.jsx</p><p>`    `PhraseBank.jsx</p><p>`    `Groups.jsx</p><p>`    `PracticeSession.jsx</p><p>`    `GroupSession.jsx</p><p>`    `PresentialSession.jsx</p><p>`    `AddWord.jsx</p><p>`  `hooks/</p><p>`    `useAuth.js</p><p>`    `useWords.js</p><p>`    `usePractice.js</p><p>`    `useGroup.js</p><p>`    `useGroupSession.js</p><p>`    `usePresentialSession.js</p><p>`  `lib/</p><p>`    `supabase.js</p><p>`    `spacedRepetition.js</p><p>`    `sessionRoles.js</p><p>`    `mergeWords.js</p><p>`  `context/</p><p>`    `AuthContext.jsx</p>|
| :- |

# **5. Variables de entorno**

|<p>VITE\_SUPABASE\_URL=https://xxxx.supabase.co</p><p>VITE\_SUPABASE\_ANON\_KEY=your-anon-key</p>|
| :- |


English Study Group App  ·  Fase 3: System Design / Spec  ·  v1.0
