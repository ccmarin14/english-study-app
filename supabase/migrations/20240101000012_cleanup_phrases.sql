-- Limpiar tablas de frases que ya no se usan (unificadas con ejemplos en traducciones)

-- Eliminar políticas RLS de phrases
DROP POLICY IF EXISTS phrases_all ON phrases;
DROP POLICY IF EXISTS gp_select ON group_phrases;
DROP POLICY IF EXISTS gp_insert ON group_phrases;

-- Eliminar índices
DROP INDEX IF EXISTS idx_phrases_owner;
DROP INDEX IF EXISTS idx_phrases_translation;
DROP INDEX IF EXISTS idx_group_phrases_group;

-- Eliminar tablas
DROP TABLE IF EXISTS phrases;
DROP TABLE IF EXISTS group_phrases;