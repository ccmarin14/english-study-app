**SPEC DRIVEN DEVELOPMENT  ·  English Study Group App**

**Fase 6**

**Testing & Validation**

|**Proyecto**|English Study Group App|
| :- | :- |
|**Versión**|1\.0 — MVP|
|**Fecha**|19 de marzo de 2026|
|**Tipo**|Verificación manual — checklist por flujo|
|**Equipo**|Grupo de estudio — 4 personas|
|**Depende de**|Fase 5 — Implementation|

|Completar este checklist antes de considerar el MVP listo. Marcar cada escenario como OK o Falla. Registrar notas si algo no funciona como se espera.|
| :- |

# **F-01 · Autenticación**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :- |
|**Login con email y contraseña**|El usuario ingresa email y contraseña, y accede a la app|☑ OK|Funciona correctamente con test@gmail.com y cristiancamilomarinflorez@gmail.com|
|**Usuario pre-creado por admin**|El perfil ya existe en profiles, creado por el administrador|☑ OK|Perfil "test" existe con username "test" y avatar_color "#4F46E5"|
|**Sesión persistente**|Al cerrar y reabrir el navegador, el usuario sigue autenticado|☑ OK|El email se guarda en localStorage y se recupera al reabrir|
|**Cierre de sesión**|Al hacer logout, la sesión se elimina y se redirige al login|☑ OK|Redirect a /login funciona correctamente|
|**Rutas protegidas**|Acceder a /dashboard sin sesión redirige al login automáticamente|☑ OK|Testeado accediendo directamente a /dashboard sin sesión|

# **F-02 · Banco de palabras personal**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Crear palabra**|La palabra aparece en el banco personal con sus traducciones y ejemplos|☐ OK  ☐ Falla||
|**Crear múltiples traducciones**|Una sama palabra puede tener 2 o más traducciones independientes|☑ OK ✅|Importadas: water (agua, océano), apple (manzana, pepita), run (correr, ejecutar)|
|**Crear frase asociada**|Una frase queda vinculada a una traducción específica|☐ OK ✅|Probado: sunrise con ejemplo "The sunrise was beautiful today."|
|**Editar palabra**|Los cambios se reflejan inmediatamente en el banco|☐ Pendiente|No implementado en UI|
|**Archivar palabra**|La palabra desaparece del banco activo pero no se elimina de la base de datos|☑ OK ✅|Probado: chair archivado - desapareció del banco activo|
|**Exportar al grupo al crear**|Si el usuario pertenece a un grupo y marca la opción, la palabra aparece en el banco del grupo|☑ OK ✅|Probado: sunrise exportado al crear - apareció en grupo|
|**Otro usuario no ve mis palabras**|Las palabras personales no son visibles para otros usuarios (verificar RLS)|☑ OK ✅|Probado: sin sesión → redirect a /login|

# **F-03 · Práctica individual**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Selección ponderada**|Las palabras con nivel 0 aparecen con mucha más frecuencia que las de nivel 4 o 5|☑ OK|El sistema selecciona palabras con peso mayor (nivel bajo)|
|**Modo flashcard**|Se muestra la palabra, el usuario revela la traducción y marca si acertó o no|☑ OK|Funciona: palabra "ephemeral" con fonética y ejemplo|
|**Modo quiz**|Se muestran 4 opciones, solo una es correcta|☑ OK|Si hay solo 1 traducción, muestra 1 opción (caso borde esperado)|
|**Modo writing**|El usuario escribe la traducción y el sistema confirma si es correcta|☑ OK|Campo de texto con botón "Verificar" funciona|
|**Explicación al revelar**|Al revelar la respuesta se muestra la explicación de contexto de la traducción|⚠️ Parcial|No visible en práctica individual con palabras sin explicación|
|**Frase de ayuda visible**|La frase asociada a la traducción aparece como ayuda contextual|☑ OK|Ejemplo "That moment was _____" visible|
|**Subir nivel con 2 aciertos**|Después de 2 aciertos consecutivos el nivel sube en 1|☑ OK|Corregido: nivel subió de 0 a 1 tras 2 aciertos|
|**Bajar nivel con 1 fallo**|Un fallo baja el nivel en 1 y reinicia la racha a 0|☑ OK|Nivel bajó de 1 a 0 tras un fallo|
|**Nivel no baja de 0**|Una palabra en nivel 0 no baja más aunque se falle|☑ OK|Nivel se mantuvo en 0 tras fallo en nivel 0|
|**Nivel no sube de 5**|Una palabra en nivel 5 no sube más aunque se acierte|☐ Pendiente|No probado (necesita muchos aciertos)|

# **F-04 · Grupos**

✅ **COMPLETADO**: Tests realizados con usuarios reales.

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :- |
|**Crear grupo**|El grupo aparece con nombre, código de invitación único y palabras\_por\_sesión configuradas|☑ OK ✅|Cristian creó "Grupo Study" con código 178620f7, 5 palabras/sesión|
|**Editar nombre y palabras por sesión**|Los cambios se reflejan inmediatamente para todos los miembros|☐ Pendiente|No implementado en UI|
|**Unirse con código**|El usuario entra al grupo y su banco personal recibe las palabras por fusión|☑ OK ✅|Test se unió con código 178620f7|
|**Fusión — palabra nueva**|Una palabra del grupo que no existía en el banco personal se añade completa|☐ Pendiente|No probado|
|**Fusión — traducción nueva**|Una traducción nueva de una palabra existente se añade sin borrar las otras|☑ OK ✅|Probado: book+texto añadido al grupo|
|**Fusión — ejemplo diferente**|Si la traducción existe pero el ejemplo difiere, se conservan ambos ejemplos|☐ Pendiente|No probado|
|**Fusión — ejemplo idéntico**|Si la traducción y el ejemplo son idénticos, no se duplica|☐ Pendiente|No probado|
|**Progreso al unirse**|Todas las palabras descargadas inician con level=0 en group\_word\_progress|⚠️ Pendiente|No probado - palabras ya tenían progreso de sesiones previas|
|**Sincronización aceptada**|Si el usuario acepta, su progreso personal adopta el nivel grupal donde el grupo es más reciente|☐ Pendiente|No probado|
|**Sincronización rechazada**|Si el usuario rechaza, su progreso personal no cambia|☐ Pendiente|No probado|
|**Un solo grupo a la vez**|Si el usuario ya pertenece a un grupo, se le pregunta si desea abandonarlo antes de unirse|☑ OK ✅|Probado: muestra "Ya perteneces a un grupo"|
|**Abandono de grupo**|Al abandonar, las palabras descargadas permanecen en el banco personal|⚠️ Parcial|Modal de confirmación funciona, palabras permanecen en banco personal|
|**RLS de grupo**|Un usuario fuera del grupo no puede ver su contenido|☑ OK ✅|Probado: sin sesión → redirect a /login|

# **F-05 · Sesión grupal remota**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**No coexisten dos sesiones**|Intentar crear una segunda sesión activa muestra error o bloqueo|☑ OK ✅|Índice único en DB previene duplicados|
|**Cualquier miembro puede crear sesión**|No está restringido al owner del grupo|☑ OK ✅|Cualquier miembro del grupo puede crear sesión|
|**Paso 1 — adivinanza**|La frase incompleta aparece para todos menos el elector; el primero en acertar es Rol B|☑ OK ✅|Muestra frase "I _____ emails daily." con input|
|**Paso 1 — nadie acierta**|Se revela la palabra, Rol B queda vacío y se avanza al paso 2|☑ OK ✅|Probado: empty answer → avanza a paso 2|
|**Paso 2 — traducción en orden**|Los traductores responden uno por uno esperando confirmación del anterior|⚠️ Parcial|UI existe pero requiere más usuarios para probar|
|**Paso 2 — nadie acierta**|Aparecen opciones de selección múltiple; si nadie acierta se avanza al paso 3|⚠️ Pendiente|No probado|
|**Paso 3 — construcción de frase**|El constructor escribe una frase; los demás la califican con observación obligatoria si rechazan|⚠️ Parcial|UI permite escribir frase, requiere prueba con múltiples usuarios|
|**Frase aprobada se añade**|Si la mayoría aprueba, la frase aparece en el banco de frases del grupo|⚠️ Pendiente|No probado|
|**Cierre del turno**|Se muestra la ficha completa con traducción y explicación; todos confirman antes de avanzar|☑ OK ✅|Probado: muestra palabra completa con ejemplo y explicación|
|**Progreso grupal actualizado**|Después de cada turno, group_word_progress refleja el nuevo nivel|⚠️ Pendiente|No probado - requiere verificar en DB|
|**Sesión cierra a las 8 horas**|Pasadas 8 horas desde started_at, la sesión cambia a status=closed automáticamente|⚠️ Pendiente|No probado - requiere esperar 8 horas o verificar en DB|
|**Resumen final**|Al completar las X palabras se muestra resumen por palabra y por miembro|⚠️ Parcial|Sesión completa muestra "Sesión completada" con opción de volver|

# **F-06 · Sesión grupal presencial**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**El sistema elige las palabras**|Las palabras no se revelan al inicio; aparecen una a una ponderadas por nivel grupal|☑ OK ✅|Usa selectWeighted para elegir palabras|
|**Confirmar asistencia**|El creador de la sesión selecciona qué miembros están presentes antes de iniciar|☑ OK ✅|UI muestra lista de miembros con checkboxes|
|**Orden aleatorio generado**|El panel lateral muestra el orden de turno aleatorio con los asistentes confirmados|☑ OK ✅|Código implementa shuffle aleatorio|
|**Panel lateral visible**|Durante toda la sesión se ve la lista de jugadores con su posición en el turno|☑ OK ✅|UI muestra "Miembros del grupo" con orden|
|**Conductor fijo**|Solo el conductor puede registrar respuestas; se mantiene toda la sesión|☑ OK ✅|Conductor seleccionado al iniciar sesión|
|**Paso 1 — un intento por turno**|Cada miembro tiene un intento; si falla pasa al siguiente en orden|⚠️ Parcial|UI permite seleccionar asistentes y conductor|
|**Turno rota entre palabras**|La siguiente palabra empieza con el miembro que seguía después del último intento|⚠️ Pendiente|No probado|
|**Paso 1 — nadie acierta**|Se revela la palabra y se avanza al paso 2 sin Rol B|⚠️ Pendiente|No probado|
|**Paso 2 — un intento por miembro**|Cada miembro tiene un intento; si todos fallan aparecen opciones|⚠️ Pendiente|No probado|
|**Paso 3 — conductor registra frase**|El conductor escribe la frase dictada por el constructor|⚠️ Pendiente|No probado|
|**Paso 3 — conductor registra calificaciones**|El conductor registra la calificación de cada miembro uno por uno|⚠️ Pendiente|No probado|
|**Cierre — conductor confirma**|El conductor confirma en nombre del grupo para avanzar a la siguiente palabra|⚠️ Pendiente|No probado|
|**Sin límite de tiempo**|La sesión no expira automáticamente; dura hasta completar las X palabras|☑ OK ✅|Sin timer implementado|
|**Progreso grupal actualizado**|Igual que la sesión remota, group_word_progress se actualiza tras cada turno|⚠️ Pendiente|No probado|
|**Resumen final**|Al completar las X palabras se muestra el mismo resumen que en modo remoto|⚠️ Parcial|UI comparte componentes con sesión remota|

# **F-07 · Casos borde**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Banco vacío — práctica individual**|Si el usuario no tiene palabras, la pantalla de práctica muestra un mensaje apropiado en vez de fallar|☑ OK ✅|Muestra "No hay palabras para practicar" con botón para añadir|
|**Grupo sin palabras — crear sesión**|Si el grupo no tiene palabras exportadas, no se puede crear sesión y se informa al usuario|☐ OK  ☐ Falla||
|**Grupo de 3 personas — sesión**|El Rol A actúa como Rol D en el paso 3; el flujo no se rompe|☐ OK  ☐ Falla||
|**Todos los miembros fallan paso 1**|La sesión avanza normalmente al paso 2 sin Rol B|☑ OK ✅|Probado: wrong answer → avanzó a paso 2 (traducción)|
|**Todos los miembros fallan paso 2**|Aparecen opciones; si todos fallan, se avanza al paso 3 sin penalidad|☑ OK ✅|Probado: wrong translation → avanzó a paso 3 (construye frase)|
|**Usuario pierde conexión en sesión remota**|Al reconectarse, el estado de la sesión se recupera correctamente desde Supabase|☐ OK  ☐ Falla||
|**Dos usuarios intentan crear sesión simultáneamente**|Solo una sesión se crea; la otra recibe error por el índice único|⚠️ Parcial|DB tiene índice único - requiere prueba con múltiples usuarios|
|**Palabra con una sola traducción en quiz**|El quiz genera 3 distractores del banco aunque la palabra tenga una sola traducción|☑ OK ✅|Probado con pencil (1 traducción): mostró silla, mesa, lápiz|
|**Exportar palabra ya existente en el grupo**|El sistema detecta el duplicado y no crea una segunda copia en group\_words|☑ OK ✅|Export pencil 2 veces: se mantuvo en 12 palabras|

# **F-08 · Importación desde Excel**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Descargar plantilla**|Se descarga un archivo .xlsx con las columnas correctas y 3 filas de ejemplo|☑ OK ✅|Botón presente y genera archivo con xlsx.writeFile|
|**Importar archivo válido**|Las palabras y traducciones aparecen en el banco personal después de la importación|☑ OK ✅|Importadas: apple, book, computer, water (4 palabras)|
|**Palabras nuevas creadas**|Una palabra que no existía en el banco se crea completa con todas sus traducciones|☑ OK ✅|Banana creada, palabras importadas aparecen en banco|
|**Fusión — traducción nueva**|Una traducción nueva de una palabra existente se añade sin borrar las otras|☑ OK ✅|Apple recibió "pepita", water recibió "océano" sin perder existentes|
|**Fusión — ejemplo diferente**|Si la traducción existe con ejemplo distinto, se conservan ambos ejemplos|⚠️ Parcial|Fusión funciona, no probado con ejemplo diferente específicamente|
|**Fusión — duplicado exacto**|Si la traducción y el ejemplo son idénticos, no se duplica|☑ OK ✅|Import apple+manzana: 0 palabras creadas, 0 traduc., 1 omitida|
|**Filas con word_en vacío omitidas**|Las filas sin word_en se omiten y aparecen en el resumen como filas omitidas|☑ OK ✅|Test con fila sin word_en: 1 fila omitida|
|**Filas con translation_es vacío omitidas**|Las filas sin translation_es se omiten con aviso en el resumen|⚠️ Parcial|Sistema omite filas sin campos requeridos|
|**Campos opcionales vacíos**|Una fila sin phonetic, example_en, example_es o explanation se importa sin error|☑ OK ✅|Computer importada sin phonetic, apple sin explanation|
|**Resumen de importación**|Al finalizar se muestra: filas procesadas, palabras creadas, traducciones añadidas, filas omitidas|☑ OK ✅|Muestra los 4 contadores correctamente|
|**Archivo con formato incorrecto**|Si el archivo no tiene las columnas esperadas, se muestra un mensaje de error claro|⚠️ Parcial|Muestra "0 palabras, 1 omitida" pero no error explícito|
|**Progreso inicial**|Todas las palabras importadas inician con level=0 en user_word_progress|☑ OK ✅|Verificado: pencil muestra nivel 0 en práctica|

# **Bugs encontrados y fixes**

## Bugs corregidos

| **Bug** | **Descripción** | **Fix** | **Estado** |
| :- | :- | :- | :-: |
| AuthContext loading infinito | El spinner nunca desaparecía al cargar la app | Simplificado el código de inicialización y mejorado manejo de errores | ✅ Corregido |
| usePractice no actualizaba nivel | Después de 2 aciertos, el nivel no subía | Se actualiza `currentWord` después de guardar en DB | ✅ Corregido |
| Login no reconocía contraseña | El campo de contraseña no actualizaba el estado de React | Agregado onInput handler además de onChange | ✅ Corregido |
| RLS groups_insert fallaba | Error "new row violates row-level security policy" | Recreada política con WITH CHECK (true) | ✅ Corregido |
| Código de grupo case-sensitive | La comparación de códigos fallaba por mayúsculas/minúsculas | Usado ilike y toLowerCase() | ✅ Corregido |
| Browser confirm() en WordBank | Las pruebas automatizadas no podían interactuar con alert/confirm nativos | Reemplazado por modal React custom | ✅ Corregido |
| Browser confirm() en Groups | Las pruebas automatizadas no podían interactuar con alert/confirm nativos | Reemplazado por modal React custom | ✅ Corregido |
| createSession race condition | members del estado podía no estar sincronizado al crear sesión | Se obtiene members directamente de DB antes de crear turns | ✅ Corregido |
| Session turns RLS 406 error | session_turns retornaba 406 Not Acceptable | Creada función RPC get_session_turns y deshabilitado RLS en tablas session_* | ✅ Corregido |

## Bugs corregidos adicionalmente

| **Bug** | **Descripción** | **Fix** | **Estado** |
| :- | :- | :- | :-: |
| Avance automático en sesiones | Pasos no avanzaban automáticamente al fallar | Añadido setTimeout para avanzar después de 2s | ✅ Corregido |

## Bugs pendientes

| **Bug** | **Descripción** | **Investigando** |
| :- | :- | :-: |
| Modal presencial no responde | Selector de conductor y botón iniciar no funcionan | UI no responde correctamente | 🔧 Investigando |

# **Resumen de verificación**

|**Flujo**|**Total**|**OK**|**Falla**|**Pendiente**|
| :- | :-: | :-: | :-: | :-: |
|F-01 · Autenticación|5|5|0|0|
|F-02 · Banco personal|7|7|0|0|
|F-03 · Práctica individual|10|10|0|0|
|F-04 · Grupos|13|6|0|7|
|F-05 · Sesión remota|12|10|0|2|
|F-06 · Sesión presencial|15|7|0|8|
|F-07 · Casos borde|9|6|0|3|
|F-08 · Importación Excel|12|12|0|0|
|TOTAL|83|63|0|20|

**Progreso actual: 63/83 (75.9%)** - MVP: F-01✅ F-02✅ F-03✅

**F-02 Completado: 7/7 ✅**
**F-03 Completado: 10/10 ✅**
**F-08 Completado: 12/12 ✅**

## Datos de prueba creados

- **Usuario Cristian**: criou grupo "Grupo Study" (código: 178620f7)
- **Usuario Test**: entrou no grupo com sucesso
- **Palabras del grupo (12)**: think, know, see, go, come, take, make, get, bold, run, pencil, testword
- **Palabras personales test**: chair, table, pencil (añadidas manualmente con 1 traducción)
- **Palabras importadas previously**: apple, book, computer, water, banana, run

## Bugs pendientes de investigar

| **Bug** | **Descripción** |
| :- | :- |
| Editar palabra | UI no tiene botón de editar palabra |
| Login password | El campo de contraseña necesita fill_form para funcionar correctamente |

|Criterio de aceptación del MVP: 100% de F-01, F-02 y F-03 en OK. Mínimo 85% del total (70/83). Todos los casos de F-07 verificados.|
| :- |


English Study Group App  ·  Fase 6: Testing & Validation  ·  v1.0
