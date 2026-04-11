import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useGroupWords(groupId) {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (groupId) {
      fetchGroupWords();
    }
  }, [groupId]);

  async function fetchGroupWords() {
    setLoading(true);

    const { data, error } = await supabase
      .from('group_words')
      .select(`
        *,
        group_word_translations(*)
      `)
      .eq('group_id', groupId)
      .order('exported_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setWords(data || []);
    }
    setLoading(false);
  }

  async function exportWord(wordId) {
    const { data: wordData, error: wordError } = await supabase
      .from('words')
      .select(`
        *,
        word_translations(*)
      `)
      .eq('id', wordId)
      .single();

    if (wordError) return { error: wordError.message };

    const existingWord = await supabase
      .from('group_words')
      .select('*')
      .eq('group_id', groupId)
      .ilike('word_en', wordData.word_en)
      .single();

    if (existingWord.data) {
      return { error: 'Esta palabra ya existe en el grupo' };
    }

    const { data: newGroupWord, error: createError } = await supabase
      .from('group_words')
      .insert({
        group_id: groupId,
        word_en: wordData.word_en,
        phonetic: wordData.phonetic,
        exported_by: user.id,
      })
      .select()
      .single();

    if (createError) return { error: createError.message };

    if (wordData.word_translations.length > 0) {
      const translations = wordData.word_translations.map(t => ({
        group_word_id: newGroupWord.id,
        translation_es: t.translation_es,
        examples_en: Array.isArray(t.examples_en) ? t.examples_en : [],
        examples_es: Array.isArray(t.examples_es) ? t.examples_es : [],
        explanation: t.explanation,
      }));

      await supabase.from('group_word_translations').insert(translations);
    }

    const { data: members } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const progressEntries = members.map(m => ({
      user_id: m.user_id,
      group_id: groupId,
      group_word_id: newGroupWord.id,
      level: 0,
      correct_streak: 0,
    }));

    await supabase.from('group_word_progress').insert(progressEntries);

    await fetchGroupWords();
    return { success: true };
  }

  return {
    words,
    loading,
    error,
    refetch: fetchGroupWords,
    exportWord,
  };
}
