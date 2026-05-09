import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWords } from '../hooks/useWords';
import { useGroups } from '../hooks/useGroups';
import { useGroupWords } from '../hooks/useGroupWords';

const STEPS = [
  { num: 1, label: 'Palabra' },
  { num: 2, label: 'Traducción' },
  { num: 3, label: 'Ejemplos' },
  { num: 4, label: 'Revisar' },
];

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

  const [step, setStep] = useState(1);
  const [showAnotherPrompt, setShowAnotherPrompt] = useState(false);

  const currentTransIndex = word.translations.length - 1;

  const addTranslation = () => {
    setWord(prev => ({
      ...prev,
      translations: [
        ...prev.translations,
        { translation_es: '', examples: [{ en: '', es: '' }], explanation: '' },
      ],
    }));
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

  const validateStep = () => {
    setError('');
    switch (step) {
      case 1:
        if (!word.word_en.trim()) {
          setError('La palabra en inglés es obligatoria');
          return false;
        }
        return true;
      case 2: {
        const trans = word.translations[currentTransIndex];
        if (!trans.translation_es.trim()) {
          setError('La traducción en español es obligatoria');
          return false;
        }
        return true;
      }
      case 3: {
        const trans = word.translations[currentTransIndex];
        const hasComplete = trans.examples.some(ex => ex.en.trim() && ex.es.trim());
        if (!hasComplete) {
          setError('Añade al menos un ejemplo completo (inglés y español)');
          return false;
        }
        if (!trans.explanation.trim()) {
          setError('La explicación de contexto es obligatoria');
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (step === 3) {
      setShowAnotherPrompt(true);
      return;
    }

    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    if (showAnotherPrompt) {
      setShowAnotherPrompt(false);
      return;
    }
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  const handleAddAnother = () => {
    addTranslation();
    setShowAnotherPrompt(false);
    setStep(2);
  };

  const handleNoMore = () => {
    setShowAnotherPrompt(false);
    setStep(4);
  };

  const handleSubmit = async () => {
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

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, idx) => (
          <div key={s.num} className="flex items-center">
            {idx > 0 && (
              <div className={`w-8 sm:w-12 h-0.5 ${step > idx ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.num
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s.num ? '\u2713' : s.num}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  step === s.num ? 'text-indigo-600 font-medium' : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">¿Qué palabra quieres aprender?</h2>
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
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fonética <span className="text-gray-400 font-normal">(opcional)</span>
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
  );

  const renderStep2 = () => {
    const trans = word.translations[currentTransIndex];
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Traducción {currentTransIndex + 1}
        </h2>
        <p className="text-sm text-gray-500">
          ¿Cómo se dice &ldquo;{word.word_en}&rdquo; en español?
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Traducción en español *
          </label>
          <input
            type="text"
            value={trans.translation_es}
            onChange={(e) => updateTranslationField(currentTransIndex, 'translation_es', e.target.value)}
            placeholder="ej: efímero"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
          />
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const trans = word.translations[currentTransIndex];
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Ejemplos para &ldquo;{trans.translation_es || 'esta traducción'}&rdquo;
        </h2>
        <p className="text-sm text-gray-500">
          Añade frases de ejemplo y una explicación de contexto.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frases de ejemplo *
          </label>
          {trans.examples.map((ex, exIdx) => (
            <div key={exIdx} className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Ejemplo {exIdx + 1}</span>
                {trans.examples.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExample(currentTransIndex, exIdx)}
                    className="text-red-500 hover:text-red-600 text-xs"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={ex.en}
                  onChange={(e) => updateExample(currentTransIndex, exIdx, 'en', e.target.value)}
                  placeholder="Inglés: The moment was ephemeral..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={ex.es}
                  onChange={(e) => updateExample(currentTransIndex, exIdx, 'es', e.target.value)}
                  placeholder="Español: El momento fue efímero..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addExample(currentTransIndex)}
            className="text-indigo-600 hover:text-indigo-700 text-sm"
          >
            + Añadir otro ejemplo
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Explicación de contexto *
          </label>
          <textarea
            value={trans.explanation}
            onChange={(e) => updateTranslationField(currentTransIndex, 'explanation', e.target.value)}
            placeholder="ej: Describe algo que dura muy poco tiempo"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    );
  };

  const renderAnotherPrompt = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        ¿Quieres añadir otra traducción?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Puedes añadir más traducciones para &ldquo;{word.word_en}&rdquo; o revisar todo antes de guardar.
      </p>
      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={handleNoMore}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          No, revisar todo
        </button>
        <button
          type="button"
          onClick={handleAddAnother}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Sí, añadir otra
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const allTranslations = word.translations.filter(t => t.translation_es.trim());
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Revisa antes de guardar</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-medium text-indigo-600 min-w-[24px]">1</div>
            <div>
              <p className="font-medium text-gray-900">{word.word_en}</p>
              {word.phonetic && (
                <p className="text-sm text-gray-500">{word.phonetic}</p>
              )}
            </div>
          </div>

          {allTranslations.map((t, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-medium text-indigo-600 min-w-[24px]">{idx + 2}</div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{t.translation_es}</p>
                {t.explanation && (
                  <p className="text-sm text-gray-500 mt-1">{t.explanation}</p>
                )}
                {t.examples.filter(e => e.en.trim() && e.es.trim()).length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {t.examples.filter(e => e.en.trim() && e.es.trim()).map((ex, exIdx) => (
                      <li key={exIdx} className="text-sm text-gray-600">
                        <span className="text-gray-800">{ex.en}</span>
                        <br />
                        <span className="text-gray-500">{ex.es}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>

        {currentGroup && (
          <div className="border-t pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exportToGroup}
                onChange={(e) => setExportToGroup(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700">
                Exportar al grupo &ldquo;{currentGroup.name}&rdquo;
              </span>
            </label>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Añadir nueva palabra</h1>

      {renderStepIndicator()}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showAnotherPrompt
        ? renderAnotherPrompt()
        : step === 1
        ? renderStep1()
        : step === 2
        ? renderStep2()
        : step === 3
        ? renderStep3()
        : renderStep4()}

      {!showAnotherPrompt && (
        <div className="flex gap-4 mt-6">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => navigate('/word-bank')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Atrás
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar palabra'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
