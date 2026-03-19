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
| :- | :- | :-: | :-: |
|**Login con Google**|El botón redirige a Google, el usuario autoriza y regresa a la app con sesión activa|☐ OK  ☐ Falla||
|**Perfil creado automáticamente**|Tras el primer login, existe un registro en profiles con el nombre de Google y avatar\_color por defecto|☐ OK  ☐ Falla||
|**Sesión persistente**|Al cerrar y reabrir el navegador, el usuario sigue autenticado|☐ OK  ☐ Falla||
|**Cierre de sesión**|Al hacer logout, la sesión se elimina y se redirige al login|☐ OK  ☐ Falla||
|**Rutas protegidas**|Acceder a /dashboard sin sesión redirige al login automáticamente|☐ OK  ☐ Falla||

# **F-02 · Banco de palabras personal**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Crear palabra**|La palabra aparece en el banco personal con sus traducciones y ejemplos|☐ OK  ☐ Falla||
|**Crear múltiples traducciones**|Una misma palabra puede tener 2 o más traducciones independientes|☐ OK  ☐ Falla||
|**Crear frase asociada**|Una frase queda vinculada a una traducción específica|☐ OK  ☐ Falla||
|**Editar palabra**|Los cambios se reflejan inmediatamente en el banco|☐ OK  ☐ Falla||
|**Archivar palabra**|La palabra desaparece del banco activo pero no se elimina de la base de datos|☐ OK  ☐ Falla||
|**Exportar al grupo al crear**|Si el usuario pertenece a un grupo y marca la opción, la palabra aparece en el banco del grupo|☐ OK  ☐ Falla||
|**Otro usuario no ve mis palabras**|Las palabras personales no son visibles para otros usuarios (verificar RLS)|☐ OK  ☐ Falla||

# **F-03 · Práctica individual**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Selección ponderada**|Las palabras con nivel 0 aparecen con mucha más frecuencia que las de nivel 4 o 5|☐ OK  ☐ Falla||
|**Modo flashcard**|Se muestra la palabra, el usuario revela la traducción y marca si acertó o no|☐ OK  ☐ Falla||
|**Modo quiz**|Se muestran 4 opciones, solo una es correcta|☐ OK  ☐ Falla||
|**Modo writing**|El usuario escribe la traducción y el sistema confirma si es correcta|☐ OK  ☐ Falla||
|**Explicación al revelar**|Al revelar la respuesta se muestra la explicación de contexto de la traducción|☐ OK  ☐ Falla||
|**Frase de ayuda visible**|La frase asociada a la traducción aparece como ayuda contextual|☐ OK  ☐ Falla||
|**Subir nivel con 2 aciertos**|Después de 2 aciertos consecutivos el nivel sube en 1|☐ OK  ☐ Falla||
|**Bajar nivel con 1 fallo**|Un fallo baja el nivel en 1 y reinicia la racha a 0|☐ OK  ☐ Falla||
|**Nivel no baja de 0**|Una palabra en nivel 0 no baja más aunque se falle|☐ OK  ☐ Falla||
|**Nivel no sube de 5**|Una palabra en nivel 5 no sube más aunque se acierte|☐ OK  ☐ Falla||

# **F-04 · Grupos**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Crear grupo**|El grupo aparece con nombre, código de invitación único y palabras\_por\_sesión configuradas|☐ OK  ☐ Falla||
|**Editar nombre y palabras por sesión**|Los cambios se reflejan inmediatamente para todos los miembros|☐ OK  ☐ Falla||
|**Unirse con código**|El usuario entra al grupo y su banco personal recibe las palabras por fusión|☐ OK  ☐ Falla||
|**Fusión — palabra nueva**|Una palabra del grupo que no existía en el banco personal se añade completa|☐ OK  ☐ Falla||
|**Fusión — traducción nueva**|Una traducción nueva de una palabra existente se añade sin borrar las otras|☐ OK  ☐ Falla||
|**Fusión — ejemplo diferente**|Si la traducción existe pero el ejemplo difiere, se conservan ambos ejemplos|☐ OK  ☐ Falla||
|**Fusión — ejemplo idéntico**|Si la traducción y el ejemplo son idénticos, no se duplica|☐ OK  ☐ Falla||
|**Progreso al unirse**|Todas las palabras descargadas inician con level=0 en group\_word\_progress|☐ OK  ☐ Falla||
|**Sincronización aceptada**|Si el usuario acepta, su progreso personal adopta el nivel grupal donde el grupo es más reciente|☐ OK  ☐ Falla||
|**Sincronización rechazada**|Si el usuario rechaza, su progreso personal no cambia|☐ OK  ☐ Falla||
|**Un solo grupo a la vez**|Si el usuario ya pertenece a un grupo, se le pregunta si desea abandonarlo antes de unirse|☐ OK  ☐ Falla||
|**Abandono de grupo**|Al abandonar, las palabras descargadas permanecen en el banco personal|☐ OK  ☐ Falla||
|**RLS de grupo**|Un usuario fuera del grupo no puede ver su contenido|☐ OK  ☐ Falla||

# **F-05 · Sesión grupal remota**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**No coexisten dos sesiones**|Intentar crear una segunda sesión activa muestra error o bloqueo|☐ OK  ☐ Falla||
|**Cualquier miembro puede crear sesión**|No está restringido al owner del grupo|☐ OK  ☐ Falla||
|**Paso 1 — adivinanza**|La frase incompleta aparece para todos menos el elector; el primero en acertar es Rol B|☐ OK  ☐ Falla||
|**Paso 1 — nadie acierta**|Se revela la palabra, Rol B queda vacío y se avanza al paso 2|☐ OK  ☐ Falla||
|**Paso 2 — traducción en orden**|Los traductores responden uno por uno esperando confirmación del anterior|☐ OK  ☐ Falla||
|**Paso 2 — nadie acierta**|Aparecen opciones de selección múltiple; si nadie acierta se avanza al paso 3|☐ OK  ☐ Falla||
|**Paso 3 — construcción de frase**|El constructor escribe una frase; los demás la califican con observación obligatoria si rechazan|☐ OK  ☐ Falla||
|**Frase aprobada se añade**|Si la mayoría aprueba, la frase aparece en el banco de frases del grupo|☐ OK  ☐ Falla||
|**Cierre del turno**|Se muestra la ficha completa con traducción y explicación; todos confirman antes de avanzar|☐ OK  ☐ Falla||
|**Progreso grupal actualizado**|Después de cada turno, group\_word\_progress refleja el nuevo nivel|☐ OK  ☐ Falla||
|**Sesión cierra a las 8 horas**|Pasadas 8 horas desde started\_at, la sesión cambia a status=closed automáticamente|☐ OK  ☐ Falla||
|**Resumen final**|Al completar las X palabras se muestra resumen por palabra y por miembro|☐ OK  ☐ Falla||

# **F-06 · Sesión grupal presencial**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**El sistema elige las palabras**|Las palabras no se revelan al inicio; aparecen una a una ponderadas por nivel grupal|☐ OK  ☐ Falla||
|**Confirmar asistencia**|El creador de la sesión selecciona qué miembros están presentes antes de iniciar|☐ OK  ☐ Falla||
|**Orden aleatorio generado**|El panel lateral muestra el orden de turno aleatorio con los asistentes confirmados|☐ OK  ☐ Falla||
|**Panel lateral visible**|Durante toda la sesión se ve la lista de jugadores con su posición en el turno|☐ OK  ☐ Falla||
|**Conductor fijo**|Solo el conductor puede registrar respuestas; se mantiene toda la sesión|☐ OK  ☐ Falla||
|**Paso 1 — un intento por turno**|Cada miembro tiene un intento; si falla pasa al siguiente en orden|☐ OK  ☐ Falla||
|**Turno rota entre palabras**|La siguiente palabra empieza con el miembro que seguía después del último intento|☐ OK  ☐ Falla||
|**Paso 1 — nadie acierta**|Se revela la palabra y se avanza al paso 2 sin Rol B|☐ OK  ☐ Falla||
|**Paso 2 — un intento por miembro**|Cada miembro tiene un intento; si todos fallan aparecen opciones|☐ OK  ☐ Falla||
|**Paso 3 — conductor registra frase**|El conductor escribe la frase dictada por el constructor|☐ OK  ☐ Falla||
|**Paso 3 — conductor registra calificaciones**|El conductor registra la calificación de cada miembro uno por uno|☐ OK  ☐ Falla||
|**Cierre — conductor confirma**|El conductor confirma en nombre del grupo para avanzar a la siguiente palabra|☐ OK  ☐ Falla||
|**Sin límite de tiempo**|La sesión no expira automáticamente; dura hasta completar las X palabras|☐ OK  ☐ Falla||
|**Progreso grupal actualizado**|Igual que la sesión remota, group\_word\_progress se actualiza tras cada turno|☐ OK  ☐ Falla||
|**Resumen final**|Al completar las X palabras se muestra el mismo resumen que en modo remoto|☐ OK  ☐ Falla||

# **F-07 · Casos borde**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Banco vacío — práctica individual**|Si el usuario no tiene palabras, la pantalla de práctica muestra un mensaje apropiado en vez de fallar|☐ OK  ☐ Falla||
|**Grupo sin palabras — crear sesión**|Si el grupo no tiene palabras exportadas, no se puede crear sesión y se informa al usuario|☐ OK  ☐ Falla||
|**Grupo de 3 personas — sesión**|El Rol A actúa como Rol D en el paso 3; el flujo no se rompe|☐ OK  ☐ Falla||
|**Todos los miembros fallan paso 1**|La sesión avanza normalmente al paso 2 sin Rol B|☐ OK  ☐ Falla||
|**Todos los miembros fallan paso 2**|Aparecen opciones; si todos fallan, se avanza al paso 3 sin penalidad|☐ OK  ☐ Falla||
|**Usuario pierde conexión en sesión remota**|Al reconectarse, el estado de la sesión se recupera correctamente desde Supabase|☐ OK  ☐ Falla||
|**Dos usuarios intentan crear sesión simultáneamente**|Solo una sesión se crea; la otra recibe error por el índice único|☐ OK  ☐ Falla||
|**Palabra con una sola traducción en quiz**|El quiz genera 3 distractores del banco aunque la palabra tenga una sola traducción|☐ OK  ☐ Falla||
|**Exportar palabra ya existente en el grupo**|El sistema detecta el duplicado y no crea una segunda copia en group\_words|☐ OK  ☐ Falla||

# **F-08 · Importación desde Excel**

|**Escenario**|**Resultado esperado**|**Estado**|**Notas**|
| :- | :- | :-: | :-: |
|**Descargar plantilla**|Se descarga un archivo .xlsx con las columnas correctas y 3 filas de ejemplo|☐ OK  ☐ Falla||
|**Importar archivo válido**|Las palabras y traducciones aparecen en el banco personal después de la importación|☐ OK  ☐ Falla||
|**Palabras nuevas creadas**|Una palabra que no existía en el banco se crea completa con todas sus traducciones|☐ OK  ☐ Falla||
|**Fusión — traducción nueva**|Una traducción nueva de una palabra existente se añade sin borrar las otras|☐ OK  ☐ Falla||
|**Fusión — ejemplo diferente**|Si la traducción existe con ejemplo distinto, se conservan ambos ejemplos|☐ OK  ☐ Falla||
|**Fusión — duplicado exacto**|Si la traducción y el ejemplo son idénticos, no se duplica|☐ OK  ☐ Falla||
|**Filas con word\_en vacío omitidas**|Las filas sin word\_en se omiten y aparecen en el resumen como filas omitidas|☐ OK  ☐ Falla||
|**Filas con translation\_es vacío omitidas**|Las filas sin translation\_es se omiten con aviso en el resumen|☐ OK  ☐ Falla||
|**Campos opcionales vacíos**|Una fila sin phonetic, example\_en, example\_es o explanation se importa sin error|☐ OK  ☐ Falla||
|**Resumen de importación**|Al finalizar se muestra: filas procesadas, palabras creadas, traducciones añadidas, filas omitidas|☐ OK  ☐ Falla||
|**Archivo con formato incorrecto**|Si el archivo no tiene las columnas esperadas, se muestra un mensaje de error claro|☐ OK  ☐ Falla||
|**Progreso inicial**|Todas las palabras importadas inician con level=0 en user\_word\_progress|☐ OK  ☐ Falla||

# **Resumen de verificación**

|**Flujo**|**Total**|**OK**|**Falla**|**% OK**|
| :- | :-: | :-: | :-: | :-: |
|F-01 · Autenticación|5||||
|F-02 · Banco personal|7||||
|F-03 · Práctica individual|10||||
|F-04 · Grupos|13||||
|F-05 · Sesión remota|12||||
|F-06 · Sesión presencial|15||||
|F-07 · Casos borde|9||||
|**F-08 · Importación Excel**|**12**||||
|TOTAL|83||||

|Criterio de aceptación del MVP: 100% de F-01, F-02 y F-03 en OK. Mínimo 85% del total (70/83). Todos los casos de F-07 verificados.|
| :- |


English Study Group App  ·  Fase 6: Testing & Validation  ·  v1.0
