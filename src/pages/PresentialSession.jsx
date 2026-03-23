import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { useGroupSession } from '../hooks/useGroupSession';

export default function PresentialSession() {
  const { currentGroup, loading: groupsLoading } = useGroups();
  const {
    session,
    currentTurn,
    members,
    attendees,
    words,
    loading,
    createSession,
    submitAttempt,
    advanceStep,
  } = useGroupSession(currentGroup?.id);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [conductorId, setConductorId] = useState(null);
  const [currentAttemptIndex, setCurrentAttemptIndex] = useState(0);
  const [step1Answers, setStep1Answers] = useState({});
  const [step2Answers, setStep2Answers] = useState({});
  const [phrase, setPhrase] = useState('');
  const [reviewResults, setReviewResults] = useState({});

  const currentWord = currentTurn
    ? words.find(w => w.id === currentTurn.group_word_id)
    : null;

  const translations = currentWord?.group_word_translations || [];
  const currentAttendee = attendees[currentAttemptIndex];
  const currentAttendeeProfile = members.find(m => m.user_id === currentAttendee?.user_id)?.profiles;

  useEffect(() => {
    if (session && session.status === 'active') {
      setCurrentAttemptIndex(0);
      setStep1Answers({});
      setStep2Answers({});
      setPhrase('');
      setReviewResults({});
    }
  }, [currentTurn?.id]);

  const handleCreateSession = async () => {
    if (selectedAttendees.length < 2) {
      alert('Selecciona al menos 2 asistentes');
      return;
    }
    if (!conductorId) {
      alert('Selecciona un conductor');
      return;
    }

    const { error } = await createSession('presential', conductorId);
    if (!error) {
      setShowSetupModal(false);
    }
  };

  const handleStep1Result = async (correct) => {
    const answer = correct ? currentWord.word_en : 'incorrect';
    await submitAttempt(answer, correct, 1);

    setStep1Answers(prev => ({
      ...prev,
      [currentAttendee?.user_id]: correct,
    }));

    if (correct) {
      setTimeout(() => advanceStep(), 1500);
    } else if (currentAttemptIndex < attendees.length - 1) {
      setCurrentAttemptIndex(prev => prev + 1);
    } else {
      alert('Nadie acertó. Se revela la palabra: ' + currentWord.word_en);
      setTimeout(() => advanceStep(), 2000);
    }
  };

  const handleStep2Result = async (correct) => {
    const answer = correct ? translations[0]?.translation_es : 'incorrect';
    await submitAttempt(answer, correct, 2);

    setStep2Answers(prev => ({
      ...prev,
      [currentAttendee?.user_id]: correct,
    }));

    if (correct) {
      setTimeout(() => advanceStep(), 1500);
    } else if (currentAttemptIndex < attendees.length - 1) {
      setCurrentAttemptIndex(prev => prev + 1);
    } else {
      alert('Nadie acertó. Se muestran opciones.');
      setTimeout(() => advanceStep(), 2000);
    }
  };

  const handlePhraseSubmit = () => {
    setReviewResults({ approved: true, observations: [] });
  };

  if (groupsLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No perteneces a un grupo</h2>
        <Link to="/groups" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
          Ir a Grupos →
        </Link>
      </div>
    );
  }

  if (!session || session.status === 'closed') {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sesión Presencial</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-2">{currentGroup.name}</h2>
              <p className="text-gray-600">{words.length} palabras disponibles</p>

              {words.length === 0 ? (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-yellow-800">
                  No hay palabras en el grupo.
                </div>
              ) : (
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Iniciar sesión presencial
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold mb-4">Miembros del grupo</h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: m.profiles?.avatar_color || '#4F46E5' }}
                  >
                    {m.profiles?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span>{m.profiles?.username || 'Usuario'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showSetupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Configurar sesión</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Asistentes</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {members.map((m) => (
                    <label key={m.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAttendees.includes(m.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAttendees([...selectedAttendees, m.user_id]);
                          } else {
                            setSelectedAttendees(selectedAttendees.filter(id => id !== m.user_id));
                          }
                        }}
                        className="rounded"
                      />
                      {m.profiles?.username || 'Usuario'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Conductor</label>
                <select
                  value={conductorId || ''}
                  onChange={(e) => setConductorId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Seleccionar conductor</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {m.profiles?.username || 'Usuario'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSetupModal(false)}
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
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
            <h3 className="font-semibold mb-4">Orden de turno</h3>
            <div className="space-y-2">
              {attendees.map((a, i) => {
                const profile = members.find(m => m.user_id === a.user_id)?.profiles;
                const isCurrent = i === currentAttemptIndex;
                const isConductor = a.user_id === conductorId;

                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      isCurrent ? 'bg-indigo-100 border-2 border-indigo-500' : ''
                    }`}
                  >
                    <span className="text-sm font-medium w-6">{i + 1}.</span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: profile?.avatar_color || '#4F46E5' }}
                    >
                      {profile?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="flex-1">{profile?.username || 'Usuario'}</span>
                    {isConductor && <span className="text-xs bg-yellow-200 px-1 rounded">🎮</span>}
                    {step1Answers[a.user_id] === true && <span className="text-green-600">✓</span>}
                    {step1Answers[a.user_id] === false && <span className="text-red-600">✗</span>}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">Paso actual: {currentTurn?.current_step}/4</p>
              {session.conductor_id && (
                <p className="text-sm text-gray-500">
                  Conductor: {members.find(m => m.user_id === session.conductor_id)?.profiles?.username}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {currentWord && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              {currentTurn?.current_step === 1 && (
                <>
                  <div className="text-center mb-6">
                    <span className="text-sm text-gray-500 uppercase tracking-wide">
                      Paso 1: Adivinanza
                    </span>
                    <p className="text-2xl text-gray-700 mt-2 italic">
                      "{translations[0]?.example_en?.replace(
                        new RegExp(currentWord.word_en, 'gi'),
                        '_____'
                      ) || '...'}"
                    </p>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-lg text-gray-600 mb-4">
                      Turno de: <strong>{currentAttendeeProfile?.username}</strong>
                    </p>
                    <p className="text-xl font-bold text-indigo-600">{currentWord.word_en}</p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleStep1Result(true)}
                      className="px-8 py-4 bg-green-500 text-white text-lg rounded-lg hover:bg-green-600"
                    >
                      ✓ Acierta
                    </button>
                    <button
                      onClick={() => handleStep1Result(false)}
                      className="px-8 py-4 bg-red-500 text-white text-lg rounded-lg hover:bg-red-600"
                    >
                      ✗ Falla
                    </button>
                  </div>
                </>
              )}

              {currentTurn?.current_step === 2 && (
                <>
                  <div className="text-center mb-6">
                    <span className="text-sm text-gray-500 uppercase tracking-wide">
                      Paso 2: Traducción
                    </span>
                    <p className="text-4xl font-bold text-indigo-600 mt-4">{currentWord.word_en}</p>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-lg text-gray-600 mb-4">
                      Turno de: <strong>{currentAttendeeProfile?.username}</strong>
                    </p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleStep2Result(true)}
                      className="px-8 py-4 bg-green-500 text-white text-lg rounded-lg hover:bg-green-600"
                    >
                      ✓ Acierta
                    </button>
                    <button
                      onClick={() => handleStep2Result(false)}
                      className="px-8 py-4 bg-red-500 text-white text-lg rounded-lg hover:bg-red-600"
                    >
                      ✗ Falla
                    </button>
                  </div>
                </>
              )}

              {currentTurn?.current_step === 3 && (
                <>
                  <div className="text-center mb-6">
                    <span className="text-sm text-gray-500 uppercase tracking-wide">
                      Paso 3: Construcción de frase
                    </span>
                    <p className="text-4xl font-bold text-indigo-600 mt-4">{currentWord.word_en}</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Escribe la frase dictada por el constructor:
                    </label>
                    <textarea
                      value={phrase}
                      onChange={(e) => setPhrase(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg h-32"
                      placeholder="La frase aparecerá aquí..."
                    />
                  </div>

                  <button
                    onClick={handlePhraseSubmit}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Enviar frase
                  </button>
                </>
              )}

              {currentTurn?.current_step === 4 && (
                <>
                  <div className="text-center mb-6">
                    <span className="text-sm text-gray-500 uppercase tracking-wide">
                      Revisión
                    </span>
                    <h2 className="text-3xl font-bold text-indigo-600 mt-2">{currentWord.word_en}</h2>
                    {currentWord.phonetic && (
                      <p className="text-gray-500">{currentWord.phonetic}</p>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    {translations.map((t, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-lg">{t.translation_es}</p>
                        {t.explanation && (
                          <p className="text-yellow-700 text-sm mt-2 bg-yellow-50 p-2 rounded">
                            💡 {t.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={advanceStep}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    ✓ Continuar a la siguiente palabra
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
