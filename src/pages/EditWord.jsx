import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWords } from '../hooks/useWords';

function getInitialWordState(wordData) {
  if (!wordData) {
    return {
      word_en: '',
      phonetic: '',
      translations: [{ translation_es: '', example_en: '', example_es: '', explanation: '' }],
    };
  }
  return {
    word_en: wordData.word_en || '',
    phonetic: wordData.phonetic || '',
    translations: wordData.word_translations?.length > 0
      ? wordData.word_translations.map(t => ({
          id: t.id,
          translation_es: t.translation_es || '',
          example_en: t.example_en || '',
          example_es: t.example_es || '',
          explanation: t.explanation || '',
        }))
      : [{ translation_es: '', example_en: '', example_es: '', explanation: '' }],
  };
}

export default function EditWord() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateWord, deleteTranslation: deleteTrans } = useWords();

  const wordData = location.state?.selectedWord;
  const [word, setWord] = useState(() => getInitialWordState(wordData));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteTrans, setConfirmDeleteTrans] = useState(null);

  const addTranslation = () => {
    setWord(prev => ({
      ...prev,
      translations: [
        ...prev.translations,
        { translation_es: '', example_en: '', example_es: '', explanation: '' },
      ],
    }));
  };

  const updateTranslation = (index, field, value) => {
    setWord(prev => ({
      ...prev,
      translations: prev.translations.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    }));
  };

  const removeTranslation = (index) => {
    const trans = word.translations[index];
    if (trans.id) {
      setConfirmDeleteTrans({ index, id: trans.id });
    } else if (word.translations.length > 1) {
      setWord(prev => ({
        ...prev,
        translations: prev.translations.filter((_, i) => i !== index),
      }));
    }
  };

  const confirmDeleteTranslation = async () => {
    if (confirmDeleteTrans) {
      await deleteTrans(confirmDeleteTrans.id);
      setWord(prev => ({
        ...prev,
        translations: prev.translations.filter((_, i) => i !== confirmDeleteTrans.index),
      }));
      setConfirmDeleteTrans(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!word.word_en.trim()) {
      setError('La palabra en inglés es obligatoria');
      return;
    }

    const validTranslations = word.translations.filter(t => t.translation_es.trim());
    if (validTranslations.length === 0) {
      setError('Al menos una traducción es obligatoria');
      return;
    }

    setLoading(true);

    const { error: updateError } = await updateWord(wordData.id, {
      word_en: word.word_en.trim(),
      phonetic: word.phonetic.trim() || null,
      translations: validTranslations,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    navigate('/word-bank');
  };

  if (!wordData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontró la palabra</p>
        <button
          onClick={() => navigate('/word-bank')}
          className="mt-4 text-indigo-600 hover:text-indigo-700"
        >
          Volver al banco →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar palabra</h1>

      {confirmDeleteTrans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">¿Eliminar traducción?</h3>
            <p className="text-gray-600 mb-4">Esta traducción se eliminará permanentemente.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setConfirmDeleteTrans(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTranslation}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Palabra en inglés *
            </label>
            <input
              type="text"
              value={word.word_en}
              onChange={(e) => setWord(prev => ({ ...prev, word_en: e.target.value }))}
              placeholder="ej: ephemeral"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fonética
            </label>
            <input
              type="text"
              value={word.phonetic}
              onChange={(e) => setWord(prev => ({ ...prev, phonetic: e.target.value }))}
              placeholder="ej: /ɪˈfem.ər.əl/"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traducciones</h3>

          {word.translations.map((translation, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-600">
                  Traducción {index + 1}
                </span>
                {word.translations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTranslation(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Traducción en español *
                  </label>
                  <input
                    type="text"
                    value={translation.translation_es}
                    onChange={(e) => updateTranslation(index, 'translation_es', e.target.value)}
                    placeholder="ej: efímero"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Ejemplo en inglés
                    </label>
                    <input
                      type="text"
                      value={translation.example_en}
                      onChange={(e) => updateTranslation(index, 'example_en', e.target.value)}
                      placeholder="ej: That moment was ephemeral..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Ejemplo en español
                    </label>
                    <input
                      type="text"
                      value={translation.example_es}
                      onChange={(e) => updateTranslation(index, 'example_es', e.target.value)}
                      placeholder="ej: Ese momento fue efímero..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Explicación de contexto
                  </label>
                  <textarea
                    value={translation.explanation}
                    onChange={(e) => updateTranslation(index, 'explanation', e.target.value)}
                    placeholder="ej: Describe algo que dura muy poco tiempo"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addTranslation}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            ➕ Añadir otra traducción
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/word-bank')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}