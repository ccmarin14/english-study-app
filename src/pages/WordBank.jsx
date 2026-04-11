import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useGroups } from '../hooks/useGroups';
import { useGroupWords } from '../hooks/useGroupWords';
import WordCard from '../components/WordCard';
import ProgressModal from '../components/ProgressModal';

export default function WordBank() {
  const { words, loading, archiveWord, fetchArchivedWords, unarchiveWord, refetch, deleteAllUserWords } = useWords();
  const { currentGroup } = useGroups();
  const { exportWord, refetch: refetchGroupWords } = useGroupWords(currentGroup?.id);
  const [search, setSearch] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const filteredWords = words.filter(word =>
    word.word_en.toLowerCase().includes(search.toLowerCase()) ||
    word.word_translations?.some(t =>
      t.translation_es.toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleArchive = async (wordId) => {
    setConfirmArchive(wordId);
  };

  const confirmArchiveWord = async () => {
    if (confirmArchive) {
      if (showArchived) {
        await unarchiveWord(confirmArchive);
      } else {
        await archiveWord(confirmArchive);
      }
      setConfirmArchive(null);
    }
  };

  const toggleArchived = async () => {
    if (showArchived) {
      await refetch();
    } else {
      await fetchArchivedWords();
    }
    setShowArchived(!showArchived);
  };

  const handleExport = async (wordId) => {
    const result = await exportWord(wordId);
    if (result?.error) {
      setExportSuccess(result.error);
    } else {
      setExportSuccess('Palabra exportada al grupo');
      await refetchGroupWords();
      setTimeout(() => setExportSuccess(null), 3000);
    }
  };

  const handleWordClick = (word) => {
    navigate('/edit-word', { state: { selectedWord: word, isFromArchive: showArchived } });
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    const result = await deleteAllUserWords();
    setDeleting(false);
    if (result?.error) {
      console.error('Error al eliminar palabras:', result.error);
    } else {
      setConfirmDeleteAll(null);
      await refetch();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {confirmArchive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {showArchived ? '¿Restaurar esta palabra?' : '¿Archivar esta palabra?'}
            </h3>
            <p className="text-gray-600 mb-4">
              {showArchived
                ? 'La palabra se restaurará y aparecerá en tu banco activo.'
                : 'La palabra se moverá al archivo y no aparecerá en la práctica.'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmArchive(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmArchiveWord}
                className={`flex-1 py-2 text-white rounded-lg ${
                  showArchived
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {showArchived ? 'Restaurar' : 'Archivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteAll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">
              ¿Eliminar todas las palabras?
            </h3>
            <p className="text-gray-600 mb-4">
              Se eliminarán {words.length} palabras y todo su progreso. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDeleteAll(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          {showArchived ? 'Palabras Archivadas' : 'Banco de Palabras'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={toggleArchived}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {showArchived ? '← Activas' : '📁 Archivadas'}
          </button>
          {!showArchived && (
            <>
              {words.length > 0 && (
                <button
                  onClick={() => setConfirmDeleteAll(true)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                >
                  🗑️ Eliminar todo
                </button>
              )}
              <button
                onClick={() => navigate('/import')}
                className="px-3 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
              >
                📥 Importar
              </button>
              <button
                onClick={() => navigate('/add-word')}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                ➕ Añadir
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <input
          type="text"
          placeholder="Buscar palabra o traducción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {filteredWords.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">
            {words.length === 0
              ? 'No tienes palabras en tu banco'
              : 'No se encontraron palabras'}
          </p>
          {words.length === 0 && (
            <button
              onClick={() => navigate('/add-word')}
              className="mt-4 text-indigo-600 hover:text-indigo-700"
            >
              Añadir tu primera palabra →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWords.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              onClick={() => handleWordClick(word)}
              onArchive={() => handleArchive(word.id)}
              onExport={!showArchived && currentGroup ? () => handleExport(word.id) : null}
              onEdit={!showArchived ? () => handleWordClick(word) : null}
              showProgress
              isArchived={showArchived}
            />
          ))}
        </div>
      )}

      {deleting && <ProgressModal message="Eliminando palabras..." />}
    </div>
  );
}
