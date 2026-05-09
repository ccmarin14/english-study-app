import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { calcWeight, selectWeighted } from '../lib/spacedRepetition';

export function usePractice() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [currentTranslation, setCurrentTranslation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [practiceStats, setPracticeStats] = useState({ correct: 0, total: 0 });

  const canStartPractice = words.length >= 5;

  useEffect(() => {
    fetchWordsForPractice();
  }, [user]);

  async function fetchWordsForPractice() {
    if (!user) return;

    setLoading(true);

    const { data: wordsData, error: wordsError } = await supabase
      .from('words')
      .select(`
        *,
        word_translations(*)
      `)
      .eq('owner_id', user.id)
      .eq('status', 'active');

    if (wordsError) {
      setError(wordsError.message);
      setLoading(false);
      return;
    }

    const { data: progressData } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', user.id);

    const progressMap = {};
    progressData?.forEach(p => {
      progressMap[p.word_id] = p;
    });

    const wordsWithProgress = wordsData.map(word => ({
      ...word,
      level: progressMap[word.id]?.level ?? 0,
      correct_streak: progressMap[word.id]?.correct_streak ?? 0,
      weight: calcWeight(progressMap[word.id]?.level ?? 0),
    }));

    setWords(wordsWithProgress);
    setLoading(false);
  }

  function selectNextWord() {
    if (words.length === 0) {
      setCurrentWord(null);
      setCurrentTranslation(null);
      return;
    }

    const selected = selectWeighted(words);

    const randomIndex = Math.floor(Math.random() * selected.word_translations.length);
    const translation = selected.word_translations[randomIndex];

    setCurrentWord(selected);
    setCurrentTranslation(translation);
  }

  async function recordAnswer(isCorrect) {
    if (!currentWord || !user) return;

    setPracticeStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    const { level, correct_streak } = calcNewProgress(
      { level: currentWord.level, correct_streak: currentWord.correct_streak },
      isCorrect
    );

    // Update local state immediately so UI shows result without refresh
    const updatedWords = words.map(w =>
      w.id === currentWord.id
        ? { ...w, level, correct_streak, weight: calcWeight(level) }
        : w
    );
    setWords(updatedWords);

    // Update current word local state
    setCurrentWord(prev => prev ? { ...prev, level, correct_streak } : null);

    // Persist to Supabase (fire and forget - don't block UI)
    supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', currentWord.id)
      .single()
      .then(({ data: existingProgress }) => {
        if (existingProgress) {
          return supabase
            .from('user_word_progress')
            .update({
              level,
              correct_streak,
              last_practiced_at: new Date().toISOString(),
            })
            .eq('id', existingProgress.id);
        } else {
          return supabase
            .from('user_word_progress')
            .insert({
              user_id: user.id,
              word_id: currentWord.id,
              level,
              correct_streak,
              last_practiced_at: new Date().toISOString(),
            });
        }
      });
    // NO longer calling fetchWordsForPractice() here to avoid refresh
  }

  function calcNewProgress(current, isCorrect) {
    if (isCorrect) {
      const newStreak = (current.correct_streak || 0) + 1;
      return newStreak >= 2
        ? { level: Math.min((current.level || 0) + 1, 5), correct_streak: 0 }
        : { level: current.level || 0, correct_streak: newStreak };
    }
    return { level: Math.max((current.level || 0) - 1, 0), correct_streak: 0 };
  }

  function resetStats() {
    setPracticeStats({ correct: 0, total: 0 });
  }

  return {
    words,
    currentWord,
    currentTranslation,
    setCurrentTranslation,
    loading,
    error,
    practiceStats,
    canStartPractice,
    selectNextWord,
    recordAnswer,
    refetch: fetchWordsForPractice,
    resetStats,
  };
}
