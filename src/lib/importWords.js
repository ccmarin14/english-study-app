import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

export async function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsBinaryString(file);
  });
}

function parseExamples(value) {
  if (!value) return [];
  const trimmed = String(value).trim();
  if (!trimmed) return [];
  
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter(e => typeof e === 'string' && e.trim());
    }
    return [trimmed];
  } catch {
    return [trimmed];
  }
}

export function groupByWord(rows) {
  const map = {};
  let skippedRows = 0;

  for (const row of rows) {
    const key = row.word_en?.trim().toLowerCase();

    if (!key || !row.translation_es?.trim()) {
      skippedRows++;
      continue;
    }

    if (!map[key]) {
      map[key] = {
        word_en: row.word_en.trim(),
        phonetic: row.phonetic?.trim() || null,
        translations: [],
      };
    }

    map[key].translations.push({
      translation_es: row.translation_es.trim(),
      examples_en: parseExamples(row.examples_en),
      examples_es: parseExamples(row.examples_es),
      explanation: row.explanation?.trim() || null,
    });
  }

  return {
    words: Object.values(map),
    skippedRows,
    totalRows: rows.length,
  };
}

export function downloadTemplate() {
  const headers = ['word_en', 'phonetic', 'translation_es', 'example_en', 'example_es', 'explanation'];
  const examples = [
    ['run', '/rʌn/', 'correr', 'She runs every morning.', 'Ella corre cada mañana.', 'Uso físico, movimiento.'],
    ['run', '/rʌn/', 'ejecutar', 'Run the program again.', 'Ejecuta el programa de nuevo.', 'Uso técnico.'],
    ['bold', '', 'audaz', 'He made a bold decision.', 'Tomó una decisión audaz.', 'Describe valentía o atrevimiento.'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Palabras');
  XLSX.writeFile(wb, 'plantilla_palabras.xlsx');
}

export async function importWords(userId, groupedWords, supabaseClient = supabase, onProgress = null) {
  const results = {
    wordsCreated: 0,
    translationsAdded: 0,
    rowsProcessed: 0,
    rowsSkipped: 0,
  };

  const total = groupedWords.words.length;

  for (let i = 0; i < groupedWords.words.length; i++) {
    const word = groupedWords.words[i];

    if (onProgress) {
      onProgress({ current: i + 1, total, word: word.word_en });
    }

    const { data: existingWords } = await supabaseClient
      .from('words')
      .select('*, word_translations(*)')
      .eq('owner_id', userId)
      .ilike('word_en', word.word_en)
      .eq('status', 'active');

    let wordId;

    if (existingWords && existingWords.length > 0) {
      wordId = existingWords[0].id;
    } else {
      const { data: newWord, error } = await supabaseClient
        .from('words')
        .insert({
          word_en: word.word_en,
          phonetic: word.phonetic,
          owner_id: userId,
        })
        .select()
        .single();

      if (error) continue;
      wordId = newWord.id;
      results.wordsCreated++;
    }

    for (const translation of word.translations) {
      const { data: existingTranslations } = await supabaseClient
        .from('word_translations')
        .select('*')
        .eq('word_id', wordId)
        .ilike('translation_es', translation.translation_es);

      console.log('Palabra:', word.word_en, '| Traducción:', translation.translation_es);
      console.log('  existingTranslations:', existingTranslations?.length || 0);
      console.log('  translation.examples_en:', translation.examples_en);

      const hasIdentical = existingTranslations?.some(t => {
        const existingExamples = Array.isArray(t.examples_en) ? t.examples_en : [];
        const newExamples = Array.isArray(translation.examples_en) ? translation.examples_en : [];
        
        if (existingExamples.length !== newExamples.length) return false;
        
        return existingExamples.every((e, i) => 
          e.toLowerCase() === (newExamples[i] || '').toLowerCase()
        );
      });

      console.log('  hasIdentical:', hasIdentical);

      if (hasIdentical) {
        results.rowsSkipped++;
        continue;
      }

      const { error } = await supabaseClient
        .from('word_translations')
        .insert({
          word_id: wordId,
          translation_es: translation.translation_es,
          examples_en: translation.examples_en || [],
          examples_es: translation.examples_es || [],
          explanation: translation.explanation,
        });

      console.log('  insert error:', error?.message || error);
      
      if (!error) {
        results.translationsAdded++;
      }
    }

    results.rowsProcessed++;
  }

  results.rowsSkipped += groupedWords.skippedRows;

  return results;
}
