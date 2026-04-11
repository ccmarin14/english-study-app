import ProgressBar from './ProgressBar';

export default function WordCard({ word, onClick, onArchive, onExport, onEdit, showProgress = false, isArchived = false }) {
  const translations = word.word_translations || [];

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{word.word_en}</h3>
          {word.phonetic && (
            <p className="text-sm text-gray-500">{word.phonetic}</p>
          )}
        </div>
        {word.level !== undefined && showProgress && (
          <div className="w-24">
            <ProgressBar level={word.level} />
          </div>
        )}
      </div>

      {translations.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-gray-600">
            {translations.map(t => t.translation_es).join(', ')}
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {translations.length > 0 && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {translations.length} traducción{translations.length !== 1 ? 'es' : ''}
          </span>
        )}
        {word.status === 'archived' && (
          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
            Archivado
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(word);
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            ✏️ Editar
          </button>
        )}
        {onExport && word.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(word.id);
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            📤 Exportar al grupo
          </button>
        )}
        {onArchive && !isArchived && word.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(word.id);
            }}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Archivar
          </button>
        )}
        {onArchive && isArchived && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(word.id);
            }}
            className="text-xs text-green-600 hover:text-green-700"
          >
            Restaurar
          </button>
        )}
      </div>
    </div>
  );
}
