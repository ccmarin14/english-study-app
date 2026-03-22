**SPEC DRIVEN DEVELOPMENT  ·  English Study Group App**

**Fase 1**

**Problem Definition**

|**Proyecto**|English Study Group App|
| :- | :- |
|**Versión**|1\.0 — MVP|
|**Fecha**|19 de marzo de 2026|
|**Equipo**|Grupo de estudio — 4 personas|

# **1. Contexto**
Un grupo de personas estudia inglés de manera informal. El grupo mantiene un banco de palabras en inglés que intenta repasar periódicamente. Cada palabra tiene una o varias traducciones al español, y cada traducción puede tener frases de ejemplo y una explicación de contexto de uso.

El nivel de dominio varía por persona: algunas palabras están bien aprendidas, otras presentan dificultad, y otras son recientes. La app debe funcionar tanto para usuarios individuales como para grupos, siendo el modo grupal completamente opcional.

# **2. Problema**
## **2.1 Método actual**
El grupo intentó usar un chat grupal de WhatsApp como herramienta de práctica:

- Un miembro publicaba una palabra o frase en el chat
- Los demás la veían en el feed de mensajes
- Se esperaba que esto generara práctica o discusión

Este método no funcionó.

## **2.2 Por qué falló**

|<p>**WhatsApp es una herramienta de comunicación, no de aprendizaje.**</p><p>Ver una palabra en un feed no equivale a practicarla activamente.</p><p>No existe estructura, turno ni responsabilidad individual.</p><p>El contenido se pierde entre otros mensajes y no hay forma de retomarlo.</p><p>No hay seguimiento de qué palabras cada persona ya domina.</p><p>No hay retroalimentación inmediata sobre si la respuesta fue correcta.</p>|
| :- |

## **2.3 Necesidades no cubiertas**
- Práctica activa: el usuario debe producir una respuesta, no solo leer
- Progreso individual: cada persona aprende a su propio ritmo
- Fricción mínima: entrar a practicar debe ser inmediato
- Banco compartido: las palabras deben poder compartirse entre miembros
- Retroalimentación inmediata: saber si acertaste o fallaste en el momento
- Interacción grupal estructurada: práctica asíncrona con mecánica colaborativa/competitiva

# **3. Usuarios**
Un único tipo de usuario con dos contextos posibles de uso:

|**Contexto**|**Descripción**|**Necesidad principal**|
| :- | :- | :- |
|**Individual**|Usa la app de forma autónoma, sin pertenecer a ningún grupo|Gestionar su banco y practicar a su ritmo|
|**Grupal**|Pertenece a un grupo a la vez, comparte y descarga contenido|Enriquecer su banco y practicar con otros|

# **4. Solución propuesta**
Una aplicación web con registro de usuarios que permite practicar vocabulario en inglés mediante técnicas de aprendizaje activo, con progreso individual medible y un sistema opcional de grupos para compartir contenido y realizar sesiones de práctica interactivas.

|<p>**Principio central**</p><p>Cada usuario siempre practica desde su banco personal.</p><p>El grupo es un espacio de sesiones estructuradas y un origen opcional de contenido para el banco personal.</p><p>El progreso es siempre individual — el grupo nunca nivela ni promedia el avance de sus miembros.</p><p>Un usuario solo puede pertenecer a un grupo a la vez.</p><p>La sincronización de progreso es voluntaria y ocurre únicamente al momento de ingresar al grupo.</p><p>Las palabras descargadas de un grupo permanecen en el banco personal aunque el usuario lo abandone.</p>|
| :- |

# **5. Criterios de éxito del MVP**
- Un usuario (creado por admin) puede acceder, crear palabras y practicarlas sin pertenecer a ningún grupo
- El sistema selecciona palabras por probabilidad ponderada inversamente al nivel de dominio
- El progreso evoluciona correctamente: sube con 2 aciertos consecutivos, baja con 1 fallo
- Un usuario puede crear un grupo, exportar palabras y otros pueden unirse y descargar el contenido
- Al unirse, el banco personal se enriquece por fusión sin perder datos existentes
- Si el usuario ya pertenece a un grupo, se le pregunta si desea abandonarlo antes de unirse al nuevo
- Al unirse, se ofrece una única oportunidad de sincronizar el progreso personal con el del grupo
- Las palabras de un grupo anterior permanecen en el banco personal al abandonarlo
- El grupo puede realizar sesiones remotas asíncronas y sesiones presenciales en un solo dispositivo

# **6. Fuera del alcance del MVP**
- Audio y pronunciación (Text-to-Speech)
- Importación de palabras desde CSV (la importación Excel sí está en el MVP)
- Notificaciones push o recordatorios por email
- Categorías o etiquetas temáticas para el banco de palabras
- Sesiones grupales en tiempo real simultáneo


English Study Group App  ·  Fase 1: Problem Definition  ·  v1.0
