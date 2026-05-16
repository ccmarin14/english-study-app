import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useGroups } from '../hooks/useGroups';
import { useGroupWords } from '../hooks/useGroupWords';
import { useAuth } from '../context/AuthContext';
import { downloadExport } from '../lib/importWords';
import WordCard from '../components/WordCard';
import ProgressModal from '../components/ProgressModal';

export default function WordBank() {
  const { user } = useAuth();
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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftAlert, setDraftAlert] = useState(location.state?.draftSaved || false);


  useEffect(() => {
    if (draftAlert) {
      const timer = setTimeout(() => setDraftAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [draftAlert]);
  const levelFilter = searchParams.get('level');
  const incompleteFilter = searchParams.get('incompleta') === '1';

  const filteredWords = useMemo(() => {
    let result = words;

    if (levelFilter !== null) {
      const lvl = parseInt(levelFilter, 10);
      if (!isNaN(lvl) && lvl >= 0 && lvl <= 5) {
        result = result.filter(
          w => w.level === lvl && w.word_translations?.length > 0
        );
      }
    }

    if (incompleteFilter) {
      result = result.filter(
        word => !word.word_translations || word.word_translations.length === 0
      );
    }

    if (search) {
      result = result.filter(word =>
        word.word_en.toLowerCase().includes(search.toLowerCase()) ||
        word.word_translations?.some(t =>
          t.translation_es.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    return result;
  }, [words, search, levelFilter, incompleteFilter]);

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
    setSearchParams({});
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

  const handleExportBank = async () => {
    try {
      await downloadExport(user.id);
    } catch (err) {
      console.error('Error al exportar:', err);
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

      {draftAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 text-lg leading-none mt-0.5">📝</span>
            <div className="flex-1">
              <p className="font-medium text-amber-800">Borrador guardado</p>
              <p className="text-sm text-amber-700 mt-1">
                Recuerda editar la palabra y añadir sus traducciones para poder practicarla.
              </p>
            </div>
            <button
              onClick={() => setDraftAlert(false)}
              className="text-amber-500 hover:text-amber-700 text-lg leading-none"
            >
              ✕
            </button>
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
              {words.length === 0 ? (
                <button
                  onClick={() => navigate('/import')}
                  className="px-3 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
                >
                  📥 Importar
                </button>
              ) : (
                <button
                  onClick={handleExportBank}
                  className="px-3 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
                >
                  📤 Exportar
                </button>
              )}
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

      <div className="flex flex-wrap items-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((lvl) => {
          const isActive = levelFilter !== null && parseInt(levelFilter, 10) === lvl;
          return (
            <button
              key={lvl}
              onClick={() => {
                if (isActive) {
                  setSearchParams({});
                } else {
                  setSearchParams({ level: lvl });
                }
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Nivel {lvl}
            </button>
          );
        })}

        <button
          onClick={() => {
            setSearchParams(incompleteFilter ? {} : { incompleta: '1' });
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
            incompleteFilter
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Incompletas
        </button>

        {(levelFilter !== null || incompleteFilter) && (
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-gray-500 hover:text-gray-700 ml-2"
          >
            Limpiar filtro
          </button>
        )}
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
