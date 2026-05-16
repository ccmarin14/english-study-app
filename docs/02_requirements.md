**SPEC DRIVEN DEVELOPMENT  ·  English Study Group App**

**Fase 2**

**Requirements**

|**Proyecto**|English Study Group App|
| :- | :- |
|**Versión**|1\.0 — MVP|
|**Fecha**|19 de marzo de 2026|
|**Depende de**|Fase 1 — Problem Definition|

# **1. Requerimientos Funcionales**
## **RF-01 · Autenticación**
- Los usuarios son creados por un administrador desde Supabase Dashboard
- Los usuarios acceden ingresando su email y contraseña mediante Supabase Auth
- Cada usuario tiene un perfil con nombre de usuario (username) y color de avatar
- La sesión es persistente: no requiere re-autenticación hasta cerrar sesión
- El usuario puede cerrar sesión y volver a iniciar con otra cuenta

## **RF-02 · Banco de palabras personal**
- Cada usuario tiene su propio banco de palabras ✅
- Una palabra tiene: término en inglés y fonética opcional ✅
- Una palabra tiene una o varias traducciones al español ✅
- Cada traducción tiene: texto en español, frase de ejemplo en inglés, frase de ejemplo en español, y explicación de contexto de uso ✅
- El usuario puede crear, editar y archivar palabras de su banco ✅
  - Crear (wizard completo): ✅
  - Guardar borrador (solo palabra en inglés, sin traducción): ✅
  - Completar palabra desde borrador: ✅ (editar y añadir traducciones → se activa automáticamente)
  - Editar palabra y traducciones: ✅ (página /edit-word)
  - Archivar: ✅
  - Ver archivadas: ✅ (toggle en banco)
  - Restaurar: ✅
- Las palabras incompletas (borradores) se muestran en el banco con badge "Incompleta" ✅
- Las palabras incompletas no tienen nivel ni progreso, y no aparecen en práctica ✅
- Al completar un borrador (añadir traducciones), la palabra se activa automáticamente ✅
- Al crear una palabra, el usuario puede elegir exportarla a su grupo (si pertenece a uno) ✅
- El usuario puede exportar todo su banco personal a un archivo .xlsx descargable con el mismo formato que la plantilla de importación ✅

## **RF-03 · Banco de frases personal**
- Cada usuario tiene su propio banco de frases ✅
- Una frase tiene: texto en inglés y texto en español ✅
- Una frase pertenece a exactamente una traducción específica de una palabra del banco ✅
- El usuario puede crear, editar y eliminar frases ✅

## **RF-04 · Sistema de práctica individual**
- El usuario puede iniciar una sesión de práctica desde su banco personal
- Se requieren al menos 5 palabras en el banco para iniciar una práctica
- La práctica inicia siempre en modo writing (escribir la traducción en español)
- El usuario puede solicitar cambio a quiz (selección múltiple) si no sabe la respuesta (solo si hay ≥5 palabras en el banco)
- El sistema valida automáticamente la respuesta y determina si es correcta o incorrecta
- Tras responder se muestra: pronunciación (phonetic), frase de uso (example_en/example_es) y explicación de contexto
- La selección de palabras usa probabilidad ponderada: menor nivel = mayor probabilidad

|<p>**Tabla de pesos por nivel**</p><p>Nivel 0 → peso 32     Nivel 1 → peso 16     Nivel 2 → peso 8</p><p>Nivel 3 → peso 4      Nivel 4 → peso 2      Nivel 5 → peso 1</p>|
| :- |

## **RF-05 · Sistema de progreso**
- Cada palabra tiene un nivel de dominio por usuario (0 a 5)
- Se requieren 2 aciertos consecutivos (correct\_streak) para subir un nivel
- Un solo fallo baja el nivel en 1 (mínimo 0) y reinicia la racha a 0
- El progreso es exclusivamente por palabra, no por frase
- No existe fecha de próxima revisión: la ponderación garantiza disponibilidad permanente

## **RF-06 · Grupos**
- Un usuario puede crear un grupo definiendo: nombre, cantidad de palabras por sesión
- El nombre y la cantidad de palabras por sesión son editables después de crear el grupo
- El sistema genera un código de invitación único por grupo
- Un usuario solo puede pertenecer a un grupo a la vez
- Un usuario puede unirse a un grupo ingresando el código de invitación
- Si el usuario ya pertenece a un grupo al intentar unirse a otro, se le pregunta si desea abandonar el grupo actual
- Si acepta el abandono: sale del grupo anterior y se une al nuevo
- Si rechaza el abandono: no ocurre ningún cambio, el usuario permanece en su grupo actual
- Las palabras descargadas de un grupo anterior permanecen en el banco personal del usuario aunque abandone el grupo
- Al unirse a un grupo, el banco completo del grupo se descarga automáticamente al banco personal
- Fusión al descargar: traducciones nuevas se añaden; si la traducción ya existe, se conservan ambos ejemplos
- Las palabras descargadas inician con nivel 0 y racha 0 en el progreso grupal
- Cualquier miembro puede exportar palabras nuevas al grupo al momento de crearlas
- El creador del grupo puede exportar palabras de su banco seleccionándolas individualmente
- Al exportar una palabra al grupo, se crea registro de progreso grupal con nivel 0 para cada miembro

## **RF-07 · Progreso grupal y sincronización**
- Cada miembro tiene progreso individual por palabra dentro del grupo
- El progreso grupal de una palabra solo avanza mediante sesiones grupales
- La sincronización es voluntaria y ocurre únicamente al momento de ingresar al grupo
- Al unirse, se le pregunta al usuario una sola vez si desea sincronizar su progreso personal con el del grupo
- Si acepta: se aplica la regla de sincronización palabra por palabra sobre todo lo practicado en el grupo
- Si rechaza: su progreso personal no cambia y los datos del grupo no se transfieren
- No existe otra oportunidad de sincronizar fuera del momento de ingreso al grupo

|<p>**Regla de sincronización**</p><p>Si last\_practiced\_at del grupo > last\_practiced\_at personal → el nivel personal adopta el nivel grupal</p><p>Si last\_practiced\_at personal >= last\_practiced\_at del grupo → el nivel personal no cambia</p><p>La sincronización cubre solo las palabras que fueron practicadas en el grupo</p><p>Las palabras sin actividad grupal conservan su progreso personal intacto</p><p>Jamás se transfiere progreso personal hacia el grupo</p>|
| :- |

## **RF-08 · Importación de palabras desde Excel**
- El usuario puede importar palabras al banco personal desde un archivo .xlsx
- El archivo sigue una estructura de una fila por traducción con las columnas: word\_en, phonetic, translation\_es, example\_en, example\_es, explanation
- Las filas con el mismo word\_en se agrupan en una sola palabra con múltiples traducciones
- La importación usa la misma lógica de fusión que al unirse a un grupo:
- Si la palabra no existe: se crea completa con todas sus traducciones
- Si la palabra existe y la traducción es nueva: se añade la traducción
- Si la traducción existe con ejemplo diferente: se conservan ambos ejemplos
- Si la traducción y el ejemplo son idénticos: se omite
- El sistema provee una plantilla descargable con las columnas correctas y filas de ejemplo
- Los campos phonetic, example\_en, example\_es y explanation son opcionales
- Si word\_en o translation\_es están vacíos en una fila, esa fila se omite con un aviso al usuario
- Durante la importación se muestra un modal con progreso en tiempo real (palabra actual y contador)
- El modal bloquea la interacción con backdrop difuminado (backdrop-blur-sm)
- Al finalizar la importación se muestra un resumen: filas procesadas, palabras creadas, traducciones añadidas, filas omitidas

## **RF-09 · Sesiones grupales**
- Solo puede existir una sesión activa a la vez por grupo
- Cualquier miembro puede crear una sesión
- Al crear la sesión se elige el modo: remota o presencial
- La sesión dura máximo 8 horas desde su creación (solo aplica para sesiones remotas)
- La práctica grupal solo ocurre dentro de sesiones activas
- El resultado de practicar en sesión grupal afecta el progreso grupal de cada palabra
- Al finalizar las X palabras de la sesión, se muestra un resumen grupal

## **RF-10 · Mecánica de sesión — modo remoto**
Cada sesión practica X palabras en turnos secuenciales. Cada turno tiene 4 pasos. Cada miembro usa su propio dispositivo.

### **Asignación de roles por turno — modo remoto**

|**Rol**|**Descripción**|**Grupo de 3**|**Grupo de 4**|**Grupo de 5+**|
| :- | :- | :- | :- | :- |
|**A — Elector**|Elige la palabra activa del turno|1 miembro|1 miembro|1 miembro|
|**B — Descubridor**|Primer miembro en adivinar la palabra en paso 1|1 miembro|1 miembro|1 miembro|
|**C — Traductores**|Escriben la traducción en paso 2|1 miembro|2 miembros|N miembros|
|**D — Constructor**|Construye frase en paso 3|Rol A (elector)|El sobrante|1 al azar entre sobrantes|

### **Paso 1 · Adivinanza**
- Participan: todos menos Rol A
- Se muestra una frase de ejemplo con la palabra reemplazada por un espacio en blanco
- Los miembros escriben libremente la palabra
- El primero en acertar se convierte en Rol B
- Si nadie acierta: se revela la palabra, Rol B queda vacío, Rol A se mantiene, se continúa al Paso 2

### **Paso 2 · Traducción**
- Participan: todos menos Rol A y Rol B (si existe)
- Los miembros escriben libremente la traducción en orden, esperando confirmación de los demás antes de que el siguiente envíe
- Si nadie escribe la traducción correctamente: se muestran opciones de selección múltiple
- Si aun así nadie acierta: todos pasan al Paso 3 sin penalidad

### **Paso 3 · Construcción de frase**
- Participa activamente: Rol D (constructor)
- El constructor escribe una oración original usando la palabra
- Todos los demás miembros (menos el constructor) califican la frase:
- ✓ Correcta: sin comentario obligatorio
- ✗ Incorrecta: observación obligatoria explicando por qué
- Si la mayoría aprueba: la frase se añade automáticamente al banco de frases del grupo

### **Cierre del turno**
- Se muestra: la palabra + todas sus traducciones + explicación de contexto
- Cada miembro confirma 'Listo ✓' individualmente
- Cuando todos confirman: se inicia el siguiente turno

## **RF-11 · Mecánica de sesión — modo presencial**
Un solo dispositivo compartido. Un conductor maneja el teclado durante toda la sesión. Las palabras las elige el sistema (ponderación por nivel) y no se revelan anticipadamente.

### **Inicio de sesión presencial**
- Quien crea la sesión confirma la asistencia: selecciona qué miembros están presentes
- El sistema genera un orden de turno aleatorio con los asistentes confirmados
- Se muestra panel lateral visible durante toda la sesión: nombre de cada jugador, posición en el turno
- Cualquier miembro presente puede ser el conductor; se mantiene durante toda la sesión

### **Asignación de roles por turno — modo presencial**

|**Rol**|**Descripción**|**Grupo de 3**|**Grupo de 4**|**Grupo de 5+**|
| :- | :- | :- | :- | :- |
|**B — Descubridor**|Primer miembro en adivinar la palabra (no hay Rol A)|1 miembro|1 miembro|1 miembro|
|**C — Traductores**|Responden la traducción en paso 2|Resto menos B y D|Resto menos B y D|Resto menos B y D|
|**D — Constructor**|Construye frase en paso 3|Quien no fue B ni C|Quien no fue B ni C|1 al azar entre sobrantes|

### **Paso 1 · Adivinanza presencial**
- Se muestra la frase incompleta en pantalla
- Los miembros responden por turno según el orden aleatorio generado al inicio
- Cada miembro tiene un intento: el conductor registra si acertó o no
- El primero en acertar se convierte en Rol B
- Si nadie acierta en su intento: se revela la palabra, Rol B queda vacío, se continúa al Paso 2
- La siguiente palabra inicia con el miembro que seguía en el orden después del último intento

### **Paso 2 · Traducción presencial**
- Participan: todos menos Rol B (si existe)
- Cada miembro tiene un intento por turno; el conductor registra la respuesta
- Si nadie acierta en su intento: se muestran opciones de selección múltiple
- Cada miembro tiene un intento sobre las opciones; si aun así nadie acierta: todos pasan al Paso 3 sin penalidad

### **Paso 3 · Construcción de frase presencial**
- El constructor (Rol D) dicta su frase en voz alta; el conductor la escribe en pantalla
- Todos los demás miembros (menos el constructor) califican uno por uno oralmente; el conductor registra cada calificación:
- ✓ Correcta: sin comentario obligatorio
- ✗ Incorrecta: observación obligatoria dictada en voz alta y escrita por el conductor
- Si la mayoría aprueba: la frase se añade automáticamente al banco de frases del grupo

### **Cierre del turno presencial**
- Se muestra: la palabra + todas sus traducciones + explicación de contexto
- El conductor confirma 'Listo ✓' en nombre del grupo
- Se avanza a la siguiente palabra automáticamente

### **Resumen final de sesión**
- Se muestra al completar las X palabras de la sesión (aplica a ambos modos)
- Contenido del resumen:
- Palabras practicadas y duración total de la sesión
- Por palabra: cuántos miembros tradujeron correctamente y si la frase fue aprobada
- Por miembro: cantidad de respuestas correctas sobre el total
- Palabra más difícil y palabra más fácil del grupo en esa sesión

## RF-12 · Eliminar banco personal completo
- El usuario puede eliminar TODAS sus palabras, traducciones y progreso individual
- La acción está disponible en el menú del banco de palabras
- Se requiere confirmación antes de ejecutar
- La confirmación muestra la cantidad de palabras que se eliminarán
- Los grupos, palabras exportadas a grupos y progreso grupal NO se ven afectados
- El usuario es redirigido al banco vacío tras la eliminación

# **2. Requerimientos No Funcionales**
## **RNF-01 · Stack tecnológico**
- Frontend: React + Vite
- Backend y base de datos: Supabase (Auth + PostgreSQL + Row Level Security)
- Credenciales gestionadas mediante variables de entorno (.env)

## **RNF-02 · Acceso y seguridad**
- Toda la aplicación requiere autenticación mediante Supabase Auth
- Los usuarios son creados y gestionados por un administrador en Supabase Dashboard
- Los datos de cada usuario están aislados mediante Row Level Security en Supabase
- Un usuario solo puede ver el contenido de grupos a los que pertenece

## **RNF-03 · Idioma**
- La interfaz es bilingüe: español e inglés
- El contenido del banco siempre usa inglés para el término y español para la traducción

## **RNF-04 · Escala**
- El MVP está diseñado para grupos pequeños (referencia: 4 personas)
- Compatible con el plan gratuito de Supabase
- Las sesiones remotas son asíncronas y no requieren WebSockets
- Las sesiones presenciales operan en un solo dispositivo; no requieren sincronización entre clientes

# **3. Pantallas del MVP**

|**ID**|**Nombre**|**Contenido principal**|
| :- | :- | :- |
|**P-01**|Login / Selector de perfil|Lista de usuarios disponibles para selección de sesión|
|**P-02**|Dashboard|Palabras pendientes, progreso personal, acceso a grupos|
|**P-03**|Banco personal|Lista de palabras y frases con filtros; añadir y editar|
|**P-04**|Grupos|Crear grupo, unirse con código, ver catálogo y progreso de miembros|
|**P-05**|Sesión individual|Elegir origen, tipo y modo; ejecutar con retroalimentación|
|**P-06**|Sesión grupal remota|Flujo de turnos asíncrono por pasos con resumen final|
|**P-07**|Sesión grupal presencial|Un dispositivo, panel lateral de turno, conductor registra respuestas|
|**P-08**|Importar palabras|Subir archivo .xlsx, vista previa de resultados, resumen de importación y descarga de plantilla|
|**P-09**|Añadir palabra|Wizard paso a paso (4 pasos): palabra, traducción, ejemplos + explicación, revisar y exportar al grupo. Incluye botón "Guardar borrador" en paso 1 para guardar solo la palabra en inglés|


English Study Group App  ·  Fase 2: Requirements  ·  v1.0
