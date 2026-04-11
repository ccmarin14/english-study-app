-- Cambiar example_en y example_es a arrays en word_translations
ALTER TABLE word_translations 
ALTER COLUMN example_en TYPE text[] USING array[example_en],
ALTER COLUMN example_es TYPE text[] USING array[example_es];

-- También cambiar en group_word_translations
ALTER TABLE group_word_translations 
ALTER COLUMN example_en TYPE text[] USING array[example_en],
ALTER COLUMN example_es TYPE text[] USING array[example_es];