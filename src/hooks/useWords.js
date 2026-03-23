import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useWords() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchWords() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('words')
      .select(`
        *,
        word_translations(*)
      `)
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setWords(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchWords();
  }, [user]);

  async function addWord(wordData) {
    const { data, error } = await supabase
      .from('words')
      .insert({
        word_en: wordData.word_en,
        phonetic: wordData.phonetic || null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) return { error };

    if (wordData.translations && wordData.translations.length > 0) {
      const translations = wordData.translations.map(t => ({
        word_id: data.id,
        translation_es: t.translation_es,
        example_en: t.example_en || null,
        example_es: t.example_es || null,
        explanation: t.explanation || null,
      }));

      const { error: transError } = await supabase
        .from('word_translations')
        .insert(translations);

      if (transError) return { error: transError };
    }

    await fetchWords();
    return { data };
  }

  async function updateWord(wordId, updates) {
    const { error } = await supabase
      .from('words')
      .update({
        word_en: updates.word_en,
        phonetic: updates.phonetic || null,
      })
      .eq('id', wordId);

    if (error) return { error };

    await fetchWords();
    return { success: true };
  }

  async function archiveWord(wordId) {
    const { error } = await supabase
      .from('words')
      .update({ status: 'archived' })
      .eq('id', wordId);

    if (error) return { error };

    await fetchWords();
    return { success: true };
  }

  async function addTranslation(wordId, translation) {
    const { error } = await supabase
      .from('word_translations')
      .insert({
        word_id: wordId,
        translation_es: translation.translation_es,
        example_en: translation.example_en || null,
        example_es: translation.example_es || null,
        explanation: translation.explanation || null,
      });

    if (error) return { error };

    await fetchWords();
    return { success: true };
  }

  return {
    words,
    loading,
    error,
    refetch: fetchWords,
    addWord,
    updateWord,
    archiveWord,
    addTranslation,
  };
}
