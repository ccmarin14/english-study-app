export async function mergeWords(personalWords, groupWords, userId) {
  const results = {
    wordsCreated: 0,
    translationsAdded: 0,
    duplicatesSkipped: 0,
  };

  const personalMap = {};
  personalWords.forEach(w => {
    personalMap[w.word_en.toLowerCase()] = w;
  });

  for (const gw of groupWords) {
    const existingWord = personalMap[gw.word_en.toLowerCase()];

    if (!existingWord) {
      results.wordsCreated++;
    } else {
      for (const gwt of gw.group_word_translations || []) {
        const existingTranslation = existingWord.word_translations?.find(
          t => t.translation_es.toLowerCase() === gwt.translation_es.toLowerCase()
        );

        if (existingTranslation) {
          if (existingTranslation.example_en !== gwt.example_en) {
            results.translationsAdded++;
          } else {
            results.duplicatesSkipped++;
          }
        } else {
          results.translationsAdded++;
        }
      }
    }
  }

  return results;
}

export function shouldAddTranslation(existing, newTranslation) {
  const existingByTranslation = {};

  existing.forEach(t => {
    const key = t.translation_es.toLowerCase();
    if (!existingByTranslation[key]) {
      existingByTranslation[key] = [];
    }
    existingByTranslation[key].push(t);
  });

  const key = newTranslation.translation_es.toLowerCase();
  const existingForTranslation = existingByTranslation[key] || [];

  if (existingForTranslation.length === 0) {
    return { action: 'add', reason: 'new_translation' };
  }

  const hasIdentical = existingForTranslation.some(
    t => t.example_en?.toLowerCase() === newTranslation.example_en?.toLowerCase()
  );

  if (hasIdentical) {
    return { action: 'skip', reason: 'identical' };
  }

  return { action: 'add', reason: 'different_example' };
}
