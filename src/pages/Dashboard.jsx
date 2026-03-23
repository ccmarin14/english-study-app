import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { calcWeight } from '../lib/spacedRepetition';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    totalWords: 0,
    wordsByLevel: [0, 0, 0, 0, 0, 0],
    pendingPractice: 0,
    currentGroup: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  async function fetchStats() {
    if (!user) return;

    const { data: words } = await supabase
      .from('words')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'active');

    const { data: progress } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', user.id);

    const levelCounts = [0, 0, 0, 0, 0, 0];
    progress?.forEach(p => {
      if (p.level >= 0 && p.level <= 5) {
        levelCounts[p.level]++;
      }
    });

    const wordsWithProgress = words?.map(w => {
      const p = progress?.find(pr => pr.word_id === w.id);
      return { ...w, level: p?.level ?? 0 };
    }) || [];

    const pending = wordsWithProgress.filter(w => calcWeight(w.level) >= 8).length;

    const { data: member } = await supabase
      .from('group_members')
      .select('*, groups(*)')
      .eq('user_id', user.id)
      .maybeSingle();

    setStats({
      totalWords: words?.length || 0,
      wordsByLevel: levelCounts,
      pendingPractice: pending,
      currentGroup: member?.groups || null,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido, {profile?.username || 'Usuario'}
          </h2>
          <p className="text-gray-600 mt-1">Continúa tu aprendizaje</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Total de palabras</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalWords}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Pendientes de práctica</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingPractice}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Grupo actual</h3>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {stats.currentGroup?.name || 'Sin grupo'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso por nivel</h3>
          <div className="flex gap-2">
            {stats.wordsByLevel.map((count, level) => (
              <div key={level} className="flex-1 text-center">
                <div
                  className="rounded-t h-24 flex items-end justify-center pb-1"
                  style={{
                    backgroundColor: `hsl(${120 - level * 24}, 70%, 50%)`,
                    opacity: count > 0 ? 1 : 0.2,
                  }}
                >
                  <span className="text-white font-bold text-lg">{count}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Nivel {level}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/practice"
            className="bg-indigo-600 text-white rounded-lg p-6 hover:bg-indigo-700 transition-colors"
          >
            <h3 className="text-xl font-semibold">🎯 Iniciar práctica</h3>
            <p className="text-indigo-100 mt-2">Practica con flashcards, quiz o escritura</p>
          </Link>

          <Link
            to="/word-bank"
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-colors"
          >
            <h3 className="text-xl font-semibold">📚 Gestionar palabras</h3>
            <p className="text-green-100 mt-2">Añade, edita o archiva palabras</p>
          </Link>
        </div>

        {stats.currentGroup && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900">
              👥 {stats.currentGroup.name}
            </h3>
            <p className="text-purple-700 mt-1">
              Código de invitación: <code className="bg-purple-100 px-2 py-1 rounded">{stats.currentGroup.invite_code}</code>
            </p>
            <Link
              to="/groups"
              className="inline-block mt-4 text-purple-700 font-medium hover:text-purple-800"
            >
              Ver grupo →
            </Link>
          </div>
        )}
      </div>
  );
}
