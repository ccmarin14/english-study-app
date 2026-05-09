import ProgressBar from './ProgressBar';

const LEVEL_BADGES = [
  { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-300' },
  { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-300' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'ring-yellow-300' },
  { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-300' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-300' },
  { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-300' },
];

export default function WordCard({ word, onClick, onArchive, onExport, onEdit, showProgress = false, isArchived = false }) {
  const translations = word.word_translations || [];
  const level = word.level;
  const badge = level !== undefined ? LEVEL_BADGES[level] ?? LEVEL_BADGES[0] : null;

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
        isArchived ? 'opacity-70' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {badge && showProgress && (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-2 mt-0.5 ${badge.bg} ${badge.text} ${badge.ring}`}
          >
            <span className="text-xs font-bold">{level}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{word.word_en}</h3>
              {word.phonetic && (
                <p className="text-sm text-gray-500">{word.phonetic}</p>
              )}
            </div>
            {level !== undefined && showProgress && (
              <div className="w-24 shrink-0">
                <ProgressBar level={level} />
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
                📁 Archivar
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
                ♻️ Restaurar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
