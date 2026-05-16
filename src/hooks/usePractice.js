import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { calcWeight, selectWeighted } from '../lib/spacedRepetition';

const SESSION_SIZE = 5;

export function usePractice() {
  const { user } = useAuth();
  const [allWords, setAllWords] = useState([]);
  const [sessionWords, setSessionWords] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [currentTranslation, setCurrentTranslation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [practiceStats, setPracticeStats] = useState({ correct: 0, total: 0 });
  const fetchedRef = useRef(false);

  const canStartPractice = allWords.length >= SESSION_SIZE;

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchWordsForPractice();
  }, [user]);

  function pickSessionWords(pool, count) {
    const remaining = [...pool];
    const selected = [];
    for (let i = 0; i < count; i++) {
      if (remaining.length === 0) break;
      const word = selectWeighted(remaining);
      selected.push(word);
      const idx = remaining.indexOf(word);
      if (idx !== -1) remaining.splice(idx, 1);
    }
    return selected;
  }

  function initSession(session) {
    setSessionWords(session);
    if (session.length > 0) {
      setSessionIndex(1);
      const word = session[0];
      const randomIndex = Math.floor(Math.random() * word.word_translations.length);
      setCurrentWord(word);
      setCurrentTranslation(word.word_translations[randomIndex]);
    } else {
      setSessionIndex(0);
      setCurrentWord(null);
      setCurrentTranslation(null);
    }
  }

  async function fetchWordsForPractice(force = false) {
    if (!user) return;
    if (force) fetchedRef.current = false;

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

    const wordsWithProgress = wordsData
      .filter(word => word.word_translations?.length > 0)
      .map(word => ({
        ...word,
        level: progressMap[word.id]?.level ?? 0,
        correct_streak: progressMap[word.id]?.correct_streak ?? 0,
        weight: calcWeight(progressMap[word.id]?.level ?? 0),
      }));

    setAllWords(wordsWithProgress);

    const session = pickSessionWords(wordsWithProgress, SESSION_SIZE);
    initSession(session);
    setLoading(false);
  }

  function selectNextWord() {
    if (sessionIndex >= sessionWords.length) return;

    const word = sessionWords[sessionIndex];
    setSessionIndex(prev => prev + 1);

    const randomIndex = Math.floor(Math.random() * word.word_translations.length);
    const translation = word.word_translations[randomIndex];

    setCurrentWord(word);
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

    const updatedWords = allWords.map(w =>
      w.id === currentWord.id
        ? { ...w, level, correct_streak, weight: calcWeight(level) }
        : w
    );
    setAllWords(updatedWords);

    setCurrentWord(prev => prev ? { ...prev, level, correct_streak } : null);

    const { error: upsertError } = await supabase
      .from('user_word_progress')
      .upsert({
        user_id: user.id,
        word_id: currentWord.id,
        level,
        correct_streak,
        last_practiced_at: new Date().toISOString(),
      }, { onConflict: 'user_id, word_id' });

    if (upsertError) {
      console.error('Error al guardar progreso:', upsertError);
    }
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

  function resetSession() {
    const session = pickSessionWords(allWords, SESSION_SIZE);
    initSession(session);
  }

  return {
    allWords,
    sessionWords,
    sessionIndex,
    currentWord,
    currentTranslation,
    setCurrentTranslation,
    loading,
    error,
    practiceStats,
    canStartPractice,
    selectNextWord,
    recordAnswer,
    refetch: () => fetchWordsForPractice(true),
    resetStats,
    resetSession,
  };
}
