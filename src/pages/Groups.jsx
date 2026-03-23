import { useState } from 'react';
import Layout from '../components/Layout';
import { useGroups } from '../hooks/useGroups';
import { useGroupWords } from '../hooks/useGroupWords';
import WordCard from '../components/WordCard';

export default function Groups() {
  const {
    groups,
    currentGroup,
    setCurrentGroup,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
  } = useGroups();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupWords, setNewGroupWords] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { words: groupWords, exportWord } = useGroupWords(currentGroup?.id);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newGroupName.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }

    const { error } = await createGroup(newGroupName.trim(), newGroupWords);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Grupo creado exitosamente');
      setShowCreate(false);
      setNewGroupName('');
      setNewGroupWords(10);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!joinCode.trim()) {
      setError('El código de invitación es obligatorio');
      return;
    }

    const { error } = await joinGroup(joinCode.trim().toUpperCase());
    if (error) {
      setError(error);
    } else {
      setSuccess('Te uniste al grupo exitosamente');
      setShowJoin(false);
      setJoinCode('');
    }
  };

  const handleLeave = async () => {
    if (!currentGroup) return;

    if (confirm('¿Estás seguro de abandonar este grupo?')) {
      await leaveGroup(currentGroup.id);
    }
  };

  const handleExport = async (wordId) => {
    await exportWord(wordId);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Grupos</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowJoin(true)}
              className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
            >
              Unirse a grupo
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Crear grupo
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg">{success}</div>
        )}

        {showCreate && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Crear nuevo grupo</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del grupo
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="ej: English Study Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Palabras por sesión
                </label>
                <input
                  type="number"
                  value={newGroupWords}
                  onChange={(e) => setNewGroupWords(parseInt(e.target.value) || 10)}
                  min={5}
                  max={50}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        )}

        {showJoin && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Unirse a un grupo</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de invitación
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="ej: ABC12345"
                  maxLength={8}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowJoin(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Unirse
                </button>
              </div>
            </form>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No perteneces a ningún grupo</p>
            <p className="mt-2">Crea uno nuevo o únete a uno existente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold mb-4">Mis grupos</h2>
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setCurrentGroup(group)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      currentGroup?.id === group.id
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Código: <code>{group.invite_code}</code>
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {currentGroup ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{currentGroup.name}</h2>
                      <p className="text-gray-500">
                        {currentGroup.words_per_session} palabras por sesión
                      </p>
                    </div>
                    <button
                      onClick={handleLeave}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Abandonar grupo
                    </button>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Palabras del grupo ({groupWords.length})
                    </h3>
                    {groupWords.length === 0 ? (
                      <p className="text-gray-500">No hay palabras exportadas al grupo</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groupWords.map((word) => (
                          <WordCard key={word.id} word={word} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Selecciona un grupo para ver sus palabras
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
