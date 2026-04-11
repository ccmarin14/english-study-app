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
    if (updates.word_en !== undefined || updates.phonetic !== undefined) {
      const { error } = await supabase
        .from('words')
        .update({
          word_en: updates.word_en,
          phonetic: updates.phonetic || null,
        })
        .eq('id', wordId);

      if (error) return { error };
    }

    if (updates.translations && updates.translations.length > 0) {
      for (const trans of updates.translations) {
        if (trans.id) {
          const { error } = await supabase
            .from('word_translations')
            .update({
              translation_es: trans.translation_es,
              example_en: trans.example_en || null,
              example_es: trans.example_es || null,
              explanation: trans.explanation || null,
            })
            .eq('id', trans.id);

          if (error) return { error };
        } else {
          const { error } = await supabase
            .from('word_translations')
            .insert({
              word_id: wordId,
              translation_es: trans.translation_es,
              example_en: trans.example_en || null,
              example_es: trans.example_es || null,
              explanation: trans.explanation || null,
            });

          if (error) return { error };
        }
      }
    }

    await fetchWords();
    return { success: true };
  }

  async function deleteTranslation(translationId) {
    const { error } = await supabase
      .from('word_translations')
      .delete()
      .eq('id', translationId);

    if (error) return { error };

    await fetchWords();
    return { success: true };
  }

  async function fetchArchivedWords() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('words')
      .select(`
        *,
        word_translations(*)
      `)
      .eq('owner_id', user.id)
      .eq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setWords(data || []);
    }
    setLoading(false);
  }

  async function unarchiveWord(wordId) {
    const { error } = await supabase
      .from('words')
      .update({ status: 'active' })
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
    fetchArchivedWords,
    addWord,
    updateWord,
    archiveWord,
    unarchiveWord,
    deleteTranslation,
    addTranslation,
  };
}
