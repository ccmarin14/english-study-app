import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { usePractice } from '../hooks/usePractice';
import ProgressBar from '../components/ProgressBar';
import QuizOption from '../components/QuizOption';

export default function Practice() {
  const {
    words,
    currentWord,
    currentTranslation,
    loading,
    practiceStats,
    selectNextWord,
    recordAnswer,
    resetStats,
  } = usePractice();

  const [mode, setMode] = useState('flashcard');
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (words.length > 0 && !currentWord) {
      selectNextWord();
    }
  }, [words, currentWord]);

  useEffect(() => {
    if (currentWord && currentTranslation && mode === 'quiz') {
      generateOptions();
    }
  }, [currentWord, currentTranslation, mode]);

  function generateOptions() {
    if (!currentWord || !currentTranslation) return;

    const correct = currentTranslation.translation_es;
    const otherTranslations = words
      .flatMap(w => w.word_translations || [])
      .map(t => t.translation_es)
      .filter(t => t !== correct);

    const shuffled = otherTranslations.sort(() => Math.random() - 0.5);
    const distractors = shuffled.slice(0, 3);

    const allOptions = [correct, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }

  function handleNext() {
    setShowAnswer(false);
    setSelectedOption(null);
    setShowResult(false);
    setWrittenAnswer('');
    selectNextWord();
  }

  function handleAnswer(isCorrect) {
    setShowResult(true);
    recordAnswer(isCorrect);
  }

  function handleQuizAnswer(option) {
    setSelectedOption(option);
    const isCorrect = option === currentTranslation?.translation_es;
    handleAnswer(isCorrect);
  }

  function handleWrittenSubmit() {
    const isCorrect = writtenAnswer.trim().toLowerCase() ===
      currentTranslation?.translation_es.toLowerCase();
    handleAnswer(isCorrect);
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (words.length === 0) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">No hay palabras para practicar</h2>
          <p className="text-gray-600 mt-2">
            Añade palabras a tu banco para comenzar a practicar
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Práctica</h1>
          <div className="text-sm text-gray-600">
            {practiceStats.correct}/{practiceStats.total} correctas
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2">
            {['flashcard', 'quiz', 'writing'].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setShowAnswer(false);
                  setSelectedOption(null);
                  setShowResult(false);
                  setWrittenAnswer('');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {m === 'flashcard' && '📇 '}
                {m === 'quiz' && '❓ '}
                {m === 'writing' && '✍️ '}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {currentWord && currentTranslation && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {mode === 'flashcard' && (
              <>
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-900">{currentWord.word_en}</h2>
                  {currentWord.phonetic && (
                    <p className="text-lg text-gray-500 mt-2">{currentWord.phonetic}</p>
                  )}
                </div>

                {currentWord.word_translations?.[0]?.example_en && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 italic">
                      "{currentWord.word_translations[0].example_en.replace(
                        new RegExp(currentWord.word_en, 'gi'),
                        '_____'
                      )}"
                    </p>
                  </div>
                )}

                {showAnswer ? (
                  <div className="mt-8 text-center">
                    <p className="text-3xl font-semibold text-indigo-600">
                      {currentTranslation.translation_es}
                    </p>
                    {currentTranslation.explanation && (
                      <p className="text-gray-600 mt-4 bg-yellow-50 p-3 rounded-lg">
                        💡 {currentTranslation.explanation}
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Revelar respuesta
                  </button>
                )}

                {showAnswer && (
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => handleAnswer(false)}
                      className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      ✗ Incorrecto
                    </button>
                    <button
                      onClick={() => handleAnswer(true)}
                      className="flex-1 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      ✓ Correcto
                    </button>
                  </div>
                )}
              </>
            )}

            {mode === 'quiz' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">{currentWord.word_en}</h2>
                </div>

                {currentWord.word_translations?.[0]?.example_en && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <p className="text-gray-600 italic">
                      "{currentWord.word_translations[0].example_en.replace(
                        new RegExp(currentWord.word_en, 'gi'),
                        '_____'
                      )}"
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {options.map((option) => (
                    <QuizOption
                      key={option}
                      option={option}
                      onClick={handleQuizAnswer}
                      disabled={showResult}
                      isCorrect={option === currentTranslation?.translation_es}
                      showResult={showResult}
                    />
                  ))}
                </div>

                {showResult && (
                  <div className="mt-6">
                    {selectedOption === currentTranslation?.translation_es ? (
                      <p className="text-center text-green-600 font-medium">✓ ¡Correcto!</p>
                    ) : (
                      <p className="text-center text-red-600 font-medium">
                        ✗ La respuesta correcta era: {currentTranslation?.translation_es}
                      </p>
                    )}
                    <button
                      onClick={handleNext}
                      className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}

            {mode === 'writing' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">{currentWord.word_en}</h2>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                  <p className="text-gray-600 italic">
                    Escribe la traducción en español
                  </p>
                </div>

                <input
                  type="text"
                  value={writtenAnswer}
                  onChange={(e) => setWrittenAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !showResult && handleWrittenSubmit()}
                  disabled={showResult}
                  placeholder="Escribe aquí..."
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />

                {showResult ? (
                  <div className="mt-4">
                    {writtenAnswer.trim().toLowerCase() === currentTranslation?.translation_es.toLowerCase() ? (
                      <p className="text-center text-green-600 font-medium">✓ ¡Correcto!</p>
                    ) : (
                      <p className="text-center text-red-600 font-medium">
                        ✗ La respuesta correcta era: {currentTranslation?.translation_es}
                      </p>
                    )}
                    <button
                      onClick={handleNext}
                      className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Siguiente →
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleWrittenSubmit}
                    disabled={!writtenAnswer.trim()}
                    className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Verificar
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {currentWord && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <ProgressBar level={currentWord.level} />
          </div>
        )}
      </div>
    </Layout>
  );
}
