import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useGroups } from '../hooks/useGroups';
import { useGroupWords } from '../hooks/useGroupWords';

export default function AddWord() {
  const navigate = useNavigate();
  const { addWord } = useWords();
  const { currentGroup } = useGroups();
  const { exportWord } = useGroupWords(currentGroup?.id);

  const [word, setWord] = useState({
    word_en: '',
    phonetic: '',
    translations: [{ translation_es: '', examples: [{ en: '', es: '' }], explanation: '' }],
  });
  const [exportToGroup, setExportToGroup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTranslation = () => {
    setWord(prev => ({
      ...prev,
      translations: [
        ...prev.translations,
        { translation_es: '', examples: [{ en: '', es: '' }], explanation: '' },
      ],
    }));
  };

  const removeTranslation = (index) => {
    if (word.translations.length > 1) {
      setWord(prev => ({
        ...prev,
        translations: prev.translations.filter((_, i) => i !== index),
      }));
    }
  };

  const updateTranslationField = (index, field, value) => {
    setWord(prev => ({
      ...prev,
      translations: prev.translations.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    }));
  };

  const addExample = (transIndex) => {
    setWord(prev => ({
      ...prev,
      translations: prev.translations.map((t, i) =>
        i === transIndex
          ? { ...t, examples: [...t.examples, { en: '', es: '' }] }
          : t
      ),
    }));
  };

  const updateExample = (transIndex, exampleIndex, field, value) => {
    setWord(prev => ({
      ...prev,
      translations: prev.translations.map((t, i) =>
        i === transIndex
          ? {
              ...t,
              examples: t.examples.map((ex, idx) =>
                idx === exampleIndex ? { ...ex, [field]: value } : ex
              ),
            }
          : t
      ),
    }));
  };

  const removeExample = (transIndex, exampleIndex) => {
    setWord(prev => ({
      ...prev,
      translations: prev.translations.map((t, i) =>
        i === transIndex
          ? { ...t, examples: t.examples.filter((_, idx) => idx !== exampleIndex) }
          : t
      ),
    }));
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

    const translationsToSave = validTranslations.map(t => ({
      translation_es: t.translation_es,
      examples_en: t.examples.filter(e => e.en.trim()).map(e => e.en.trim()),
      examples_es: t.examples.filter(e => e.es.trim()).map(e => e.es.trim()),
      explanation: t.explanation || null,
    }));

    const { data: newWord, error: addError } = await addWord({
      word_en: word.word_en.trim(),
      phonetic: word.phonetic.trim() || null,
      translations: translationsToSave,
    });

    if (addError) {
      setError(addError.message);
      setLoading(false);
      return;
    }

    if (exportToGroup && currentGroup && newWord) {
      await exportWord(newWord.id);
    }

    navigate('/word-bank');
  };

  return (
    <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Añadir nueva palabra</h1>

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
                      onChange={(e) => updateTranslationField(index, 'translation_es', e.target.value)}
                      placeholder="ej: efímero"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-2">
                      Ejemplos (frases)
                    </label>
                    {translation.examples.map((ex, exIdx) => (
                      <div key={exIdx} className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={ex.en}
                            onChange={(e) => updateExample(index, exIdx, 'en', e.target.value)}
                            placeholder="Inglés: The moment was ephemeral..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            value={ex.es}
                            onChange={(e) => updateExample(index, exIdx, 'es', e.target.value)}
                            placeholder="Español: El momento fue efímero..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        {translation.examples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExample(index, exIdx)}
                            className="text-red-500 hover:text-red-600 text-xs mt-2 flex items-center gap-1"
                          >
                            🗑️ Eliminar
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addExample(index)}
                      className="text-indigo-600 hover:text-indigo-700 text-xs"
                    >
                      ➕ Añadir ejemplo
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Explicación de contexto
                    </label>
                    <textarea
                      value={translation.explanation}
                      onChange={(e) => updateTranslationField(index, 'explanation', e.target.value)}
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

          {currentGroup && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportToGroup}
                  onChange={(e) => setExportToGroup(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700">
                  Exportar al grupo "{currentGroup.name}"
                </span>
              </label>
            </div>
          )}

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
              {loading ? 'Guardando...' : 'Guardar palabra'}
            </button>
          </div>
        </form>
      </div>
  );
}