import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const LEVELS = [
  { level: 1, label: 'Inicial', color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { level: 2, label: 'En práctica', color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { level: 3, label: 'Avanzando', color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { level: 4, label: 'Consolidada', color: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { level: 5, label: 'Dominada', color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
];

function LevelBar({ levelInfo, count, maxCount, onClick }) {
  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-shadow hover:shadow-md cursor-pointer border ${levelInfo.border} ${levelInfo.bg}`}
    >
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${levelInfo.color}`} />
      <span className={`text-xs font-semibold w-20 ${levelInfo.text}`}>{levelInfo.label}</span>
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${levelInfo.color}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-700 w-8 text-right">{count}</span>
    </button>
  );
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalWords: 0,
    wordsByLevel: [0, 0, 0, 0, 0, 0],
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
    const progressMap = {};

    progress?.forEach(p => {
      progressMap[p.word_id] = p;
      if (p.level >= 0 && p.level <= 5) {
        levelCounts[p.level]++;
      }
    });

    words?.forEach(w => {
      if (!progressMap[w.id]) {
        levelCounts[0]++;
      }
    });

    const { data: member } = await supabase
      .from('group_members')
      .select('*, groups(*)')
      .eq('user_id', user.id)
      .maybeSingle();

    setStats({
      totalWords: words?.length || 0,
      wordsByLevel: levelCounts,
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

  const maxCount = Math.max(...stats.wordsByLevel, 1);

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
          <h3 className="text-sm font-medium text-gray-500">Sin practicar</h3>
          <p className="text-3xl font-bold text-gray-400 mt-2">{stats.wordsByLevel[0]}</p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.wordsByLevel[0] === 1 ? 'Palabra nunca practicada' : 'Palabras nunca practicadas'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500">Grupo actual</h3>
          <p className="text-lg font-semibold text-gray-900 mt-2">
            {stats.currentGroup?.name || 'Sin grupo'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Progreso por nivel</h3>
          <span className="text-xs text-gray-400">
            {stats.totalWords} palabra{stats.totalWords !== 1 ? 's' : ''} en total
          </span>
        </div>
        <div className="space-y-2">
          {LEVELS.map(levelInfo => (
            <LevelBar
              key={levelInfo.level}
              levelInfo={levelInfo}
              count={stats.wordsByLevel[levelInfo.level]}
              maxCount={maxCount}
              onClick={() => navigate(`/word-bank?level=${levelInfo.level}`)}
            />
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
          {stats.wordsByLevel[0] > 0 && (
            <p className="text-indigo-200 text-sm mt-1">
              {stats.wordsByLevel[0]} palabra{stats.wordsByLevel[0] !== 1 ? 's' : ''} sin practicar
            </p>
          )}
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
