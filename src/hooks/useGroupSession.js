import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { calcWeight, selectWeighted } from '../lib/spacedRepetition';

export function useGroupSession(groupId) {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (groupId) {
      fetchSession();
      fetchMembers();
      fetchWords();
    }
  }, [groupId, user]);

  useEffect(() => {
    if (session && session.status === 'active') {
      fetchCurrentTurn();
    }
  }, [session]);

  async function fetchSession() {
    const { data, error } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      setError(error.message);
    }
    setSession(data || null);
    setLoading(false);
  }

  async function fetchMembers() {
    const { data } = await supabase
      .from('group_members')
      .select('*, profiles(*)')
      .eq('group_id', groupId);

    setMembers(data || []);
  }

  async function fetchWords() {
    const { data } = await supabase
      .from('group_words')
      .select(`
        *,
        group_word_translations(*)
      `)
      .eq('group_id', groupId);

    if (data) {
      const { data: progress } = await supabase
        .from('group_word_progress')
        .select('*')
        .eq('group_id', groupId);

      const avgProgress = {};
      progress?.forEach(p => {
        if (!avgProgress[p.group_word_id]) {
          avgProgress[p.group_word_id] = { total: 0, count: 0 };
        }
        avgProgress[p.group_word_id].total += p.level;
        avgProgress[p.group_word_id].count++;
      });

      const wordsWithProgress = data.map(w => {
        const avg = avgProgress[w.id];
        const level = avg ? Math.round(avg.total / avg.count) : 0;
        return { ...w, level, weight: calcWeight(level) };
      });

      setWords(wordsWithProgress);
    }
  }

  async function fetchCurrentTurn() {
    // Try RPC first, fall back to direct query
    const { data: rpcData } = await supabase.rpc('get_session_turns', { p_session_id: session.id });
    
    if (rpcData && rpcData.length > 0) {
      setCurrentTurn(rpcData[0]);
      return;
    }

    // Fallback to direct query
    const { data } = await supabase
      .from('session_turns')
      .select('*')
      .eq('session_id', session.id)
      .eq('status', 'active')
      .single();

    setCurrentTurn(data || null);
  }

  async function createSession(mode, conductorId = null) {
    const selectedWords = [];
    const wordsCopy = [...words];

    for (let i = 0; i < Math.min(10, wordsCopy.length); i++) {
      const selected = selectWeighted(wordsCopy);
      selectedWords.push(selected);
      wordsCopy.splice(wordsCopy.findIndex(w => w.id === selected.id), 1);
    }

    const { data: currentMembers } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const { data: newSession, error: sessionError } = await supabase
      .from('group_sessions')
      .insert({
        group_id: groupId,
        created_by: user.id,
        mode,
        conductor_id: mode === 'presential' ? conductorId : null,
        word_count: selectedWords.length,
      })
      .select()
      .single();

    if (sessionError) return { error: sessionError.message };

    const memberIds = currentMembers?.map(m => m.user_id) || [];

    const turns = selectedWords.map((word, index) => ({
      session_id: newSession.id,
      group_word_id: word.id,
      turn_order: index + 1,
      constructor_id: memberIds[index % memberIds.length] || user.id,
      current_step: 1,
      status: 'active',
    }));

    await supabase.from('session_turns').insert(turns);

    if (mode === 'presential') {
      const shuffledAttendees = [...members].sort(() => Math.random() - 0.5);
      const attendeeInserts = shuffledAttendees.map((m, i) => ({
        session_id: newSession.id,
        user_id: m.user_id,
        turn_order: i + 1,
      }));
      await supabase.from('session_attendees').insert(attendeeInserts);

      const { data: attendeeData } = await supabase
        .from('session_attendees')
        .select('*')
        .eq('session_id', newSession.id)
        .order('turn_order');

      setAttendees(attendeeData || []);
    }

    setSession(newSession);
    fetchCurrentTurn();

    return { data: newSession };
  }

  async function submitAttempt(answer, isCorrect, step) {
    if (!currentTurn) return;

    await supabase.from('session_attempts').insert({
      turn_id: currentTurn.id,
      user_id: user.id,
      step,
      answer,
      is_correct: isCorrect,
    });

    if (step === 1 && isCorrect) {
      await supabase
        .from('session_turns')
        .update({ discoverer_id: user.id })
        .eq('id', currentTurn.id)
        .is('discoverer_id', null);
    }

    await updateGroupProgress(currentTurn.group_word_id, isCorrect);
    await fetchCurrentTurn();
  }

  async function updateGroupProgress(groupWordId, isCorrect) {
    const { data: existing } = await supabase
      .from('group_word_progress')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('group_word_id', groupWordId)
      .single();

    const current = { level: existing?.level ?? 0, correct_streak: existing?.correct_streak ?? 0 };
    let newProgress;

    if (isCorrect) {
      const newStreak = current.correct_streak + 1;
      newProgress = newStreak >= 2
        ? { level: Math.min(current.level + 1, 5), correct_streak: 0 }
        : { level: current.level, correct_streak: newStreak };
    } else {
      newProgress = { level: Math.max(current.level - 1, 0), correct_streak: 0 };
    }

    if (existing) {
      await supabase
        .from('group_word_progress')
        .update({
          ...newProgress,
          last_practiced_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('group_word_progress').insert({
        user_id: user.id,
        group_id: groupId,
        group_word_id: groupWordId,
        ...newProgress,
        last_practiced_at: new Date().toISOString(),
      });
    }
  }

  async function submitPhrase(phraseEn) {
    if (!currentTurn) return;

    const { data: submission } = await supabase
      .from('session_submissions')
      .insert({
        turn_id: currentTurn.id,
        constructor_id: user.id,
        phrase_en: phraseEn,
      })
      .select()
      .single();

    return submission;
  }

  async function submitReview(submissionId, approved, observation = null) {
    await supabase.from('session_reviews').insert({
      submission_id: submissionId,
      reviewer_id: user.id,
      approved,
      observation,
    });

    const { data: reviews } = await supabase
      .from('session_reviews')
      .select('*')
      .eq('submission_id', submissionId);

    const totalReviews = reviews.length;
    const approvals = reviews.filter(r => r.approved).length;

    if (totalReviews >= members.length - 1) {
      const phraseApproved = approvals > totalReviews / 2;
      await supabase
        .from('session_submissions')
        .update({ approved: phraseApproved })
        .eq('id', submissionId);
    }
  }

  async function advanceStep() {
    if (!currentTurn) return;

    const nextStep = currentTurn.current_step + 1;

    if (nextStep > 4) {
      await supabase
        .from('session_turns')
        .update({ status: 'closed' })
        .eq('id', currentTurn.id);

      const { data: nextTurn } = await supabase
        .from('session_turns')
        .select('*')
        .eq('session_id', session.id)
        .eq('status', 'active')
        .single();

      if (!nextTurn) {
        await closeSession();
      } else {
        setCurrentTurn(nextTurn);
      }
    } else {
      await supabase
        .from('session_turns')
        .update({ current_step: nextStep })
        .eq('id', currentTurn.id);

      setCurrentTurn({ ...currentTurn, current_step: nextStep });
    }
  }

  async function confirmReady() {
    await supabase.from('session_turn_confirmations').insert({
      turn_id: currentTurn.id,
      user_id: user.id,
    });

    const { data: confirmations } = await supabase
      .from('session_turn_confirmations')
      .select('*')
      .eq('turn_id', currentTurn.id);

    if (confirmations.length >= members.length) {
      await supabase
        .from('session_turn_confirmations')
        .delete()
        .eq('turn_id', currentTurn.id);

      advanceStep();
    }
  }

  async function closeSession() {
    await supabase
      .from('group_sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    setSession({ ...session, status: 'closed' });
  }

  async function getSessionSummary() {
    const { data: turns } = await supabase
      .from('session_turns')
      .select(`
        *,
        group_words(word_en),
        session_attempts(*),
        session_submissions(*, session_reviews(*))
      `)
      .eq('session_id', session.id)
      .order('turn_order');

    return turns || [];
  }

  return {
    session,
    currentTurn,
    members,
    attendees,
    words,
    loading,
    error,
    createSession,
    submitAttempt,
    submitPhrase,
    submitReview,
    advanceStep,
    confirmReady,
    closeSession,
    getSessionSummary,
    refetch: fetchSession,
  };
}
