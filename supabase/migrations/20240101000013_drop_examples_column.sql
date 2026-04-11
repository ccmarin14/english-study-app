-- Eliminar columna examples多余的 que no debería existir
-- Mantener solo example_en y example_es como arrays

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'word_translations' 
    AND column_name = 'examples'
  ) THEN
    ALTER TABLE word_translations DROP COLUMN IF EXISTS examples;
  END IF;
END $$;

-- Lo mismo para group_word_translations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_word_translations' 
    AND column_name = 'examples'
  ) THEN
    ALTER TABLE group_word_translations DROP COLUMN IF EXISTS examples;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
