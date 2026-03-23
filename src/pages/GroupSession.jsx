import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useGroups } from '../hooks/useGroups';
import { useGroupSession } from '../hooks/useGroupSession';

export default function GroupSession() {
  const { currentGroup, loading: groupsLoading } = useGroups();
  const {
    session,
    currentTurn,
    members,
    words,
    loading,
    createSession,
    submitAttempt,
    advanceStep,
    confirmReady,
    closeSession,
  } = useGroupSession(currentGroup?.id);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mode, setMode] = useState('remote');
  const [step1Answer, setStep1Answer] = useState('');
  const [step2Answer, setStep2Answer] = useState('');
  const [showHint, setShowHint] = useState(false);

  const currentWord = currentTurn
    ? words.find(w => w.id === currentTurn.group_word_id)
    : null;

  const translations = currentWord?.group_word_translations || [];
  const randomTranslation = translations.length > 0
    ? translations[Math.floor(Math.random() * translations.length)]
    : null;

  const incompleteExample = randomTranslation?.example_en
    ? randomTranslation.example_en.replace(
        new RegExp(currentWord.word_en, 'gi'),
        '_____'
      )
    : '';

  const handleCreateSession = async () => {
    const { error } = await createSession(mode);
    if (!error) {
      setShowCreateModal(false);
    }
  };

  const handleStep1Submit = async () => {
    const isCorrect = step1Answer.toLowerCase().trim() === currentWord.word_en.toLowerCase();
    await submitAttempt(step1Answer, isCorrect, 1);
    setStep1Answer('');
    if (isCorrect || !currentTurn?.discoverer_id) {
      setShowHint(true);
    }
  };

  const handleStep2Submit = async () => {
    const isCorrect = translations.some(
      t => t.translation_es.toLowerCase() === step2Answer.toLowerCase().trim()
    );
    await submitAttempt(step2Answer, isCorrect, 2);
    setStep2Answer('');
  };

  if (groupsLoading || loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!currentGroup) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">No perteneces a un grupo</h2>
          <Link to="/groups" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
            Ir a Grupos →
          </Link>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Sesión Grupal</h1>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">{currentGroup.name}</h2>
            <p className="text-gray-600">{words.length} palabras disponibles</p>
            <p className="text-gray-600">{members.length} miembros</p>
          </div>

          {words.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">
                No hay palabras en el grupo. Exporta palabras desde tu banco personal para comenzar una sesión.
              </p>
              <Link
                to="/groups"
                className="inline-block mt-4 text-indigo-600 hover:text-indigo-700"
              >
                Ir al grupo →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Iniciar nueva sesión</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Comenzar sesión
              </button>
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Modo de sesión</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setMode('remote')}
                  className={`w-full p-4 rounded-lg border-2 ${
                    mode === 'remote'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200'
                  }`}
                >
                  <h4 className="font-medium">🌐 Remoto</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Cada miembro participa desde su dispositivo
                  </p>
                </button>
                <button
                  onClick={() => setMode('presential')}
                  className={`w-full p-4 rounded-lg border-2 ${
                    mode === 'presential'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200'
                  }`}
                >
                  <h4 className="font-medium">👥 Presencial</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Un dispositivo compartido con conductor
                  </p>
                </button>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateSession}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Iniciar
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  if (session.status === 'closed') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sesión completada</h2>
          <p className="text-gray-600 mb-6">
            La sesión ha finalizado. ¡Buen trabajo!
          </p>
          <Link
            to="/groups"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Volver al grupo
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-500">Modo</span>
              <p className="font-medium">{session.mode === 'remote' ? '🌐 Remoto' : '👥 Presencial'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Paso</span>
              <p className="font-medium">{currentTurn?.current_step || 1} / 4</p>
            </div>
            <button
              onClick={closeSession}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Finalizar sesión
            </button>
          </div>
        </div>

        {currentWord && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {currentTurn?.current_step === 1 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-2">Adivina la palabra</h2>
                  <p className="text-xl text-gray-700 italic">"{incompleteExample}"</p>
                </div>
                <input
                  type="text"
                  value={step1Answer}
                  onChange={(e) => setStep1Answer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStep1Submit()}
                  placeholder="Escribe la palabra en inglés..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-xl"
                />
                <button
                  onClick={handleStep1Submit}
                  className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Enviar
                </button>
                {showHint && !currentTurn?.discoverer_id && (
                  <p className="mt-4 text-center text-sm text-yellow-600">
                    💡 Nadie acertó. La palabra era: <strong>{currentWord.word_en}</strong>
                  </p>
                )}
              </>
            )}

            {currentTurn?.current_step === 2 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-2">Traduce la palabra</h2>
                  <p className="text-3xl font-bold text-indigo-600">{currentWord.word_en}</p>
                </div>
                <input
                  type="text"
                  value={step2Answer}
                  onChange={(e) => setStep2Answer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStep2Submit()}
                  placeholder="Escribe la traducción en español..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-xl"
                />
                <button
                  onClick={handleStep2Submit}
                  className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Enviar
                </button>
              </>
            )}

            {currentTurn?.current_step === 3 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-2">Construye una frase</h2>
                  <p className="text-3xl font-bold text-indigo-600">{currentWord.word_en}</p>
                </div>
                <p className="text-gray-600 text-center mb-4">
                  Escribe una frase original usando esta palabra
                </p>
                <textarea
                  placeholder="Escribe aquí tu frase en inglés..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 h-32"
                />
                <button
                  onClick={advanceStep}
                  className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Enviar frase
                </button>
              </>
            )}

            {currentTurn?.current_step === 4 && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-indigo-600">{currentWord.word_en}</h2>
                  {currentWord.phonetic && (
                    <p className="text-gray-500">{currentWord.phonetic}</p>
                  )}
                </div>
                <div className="space-y-4">
                  {translations.map((t, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-lg">{t.translation_es}</p>
                      {t.example_en && (
                        <p className="text-gray-600 text-sm mt-2 italic">"{t.example_en}"</p>
                      )}
                      {t.explanation && (
                        <p className="text-yellow-700 text-sm mt-2 bg-yellow-50 p-2 rounded">
                          💡 {t.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={confirmReady}
                  className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ✓ Listo, siguiente
                </button>
              </>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium mb-2">Miembros</h3>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m.id}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {m.profiles?.username || 'Usuario'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
