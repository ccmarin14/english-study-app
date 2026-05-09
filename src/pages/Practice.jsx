import { useState, useEffect, useRef } from 'react';
import { usePractice } from '../hooks/usePractice';
import ProgressBar from '../components/ProgressBar';
import QuizOption from '../components/QuizOption';

function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isFuzzyMatch(answer, correct, maxDistance = 2) {
  const a = normalizeText(answer);
  const b = normalizeText(correct);
  
  if (a === b) return true;
  
  const matrix = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length] <= maxDistance;
}

export default function Practice() {
  const {
    words,
    currentWord,
    currentTranslation,
    loading,
    practiceStats,
    canStartPractice,
    selectNextWord,
    recordAnswer,
    resetStats,
    setCurrentTranslation,
  } = usePractice();

  const [translationIdx, setTranslationIdx] = useState(0);
  const [waitingForRetry, setWaitingForRetry] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [options, setOptions] = useState([]);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [practicedCount, setPracticedCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const TOTAL_WORDS = 5;
  const inputRef = useRef(null);

  useEffect(() => {
    if (words.length > 0 && !currentWord) {
      selectNextWord();
    }
  }, [words, currentWord]);

  useEffect(() => {
    if (currentWord && currentTranslation) {
      const idx = currentWord.word_translations.findIndex(
        t => t.id === currentTranslation.id
      );
      setTranslationIdx(idx >= 0 ? idx : 0);
    }
  }, [currentWord, currentTranslation]);

  useEffect(() => {
    if (currentTranslation?.example_en?.length > 1) {
      const idx = Math.floor(Math.random() * currentTranslation.example_en.length);
      setExampleIdx(idx);
    } else {
      setExampleIdx(0);
    }
  }, [currentTranslation]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Enter' && !inputRef.current && answered) {
        if (showFinalize) {
          handleFinalize();
        } else {
          handleNext();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [answered, showFinalize, handleNext, handleFinalize]);

  useEffect(() => {
    if (!answered && !waitingForRetry && currentWord) {
      inputRef.current?.focus();
    }
  }, [currentWord, answered, waitingForRetry]);

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

  function cycleTranslation(delta) {
    const translations = currentWord?.word_translations;
    if (!translations || translations.length <= 1) return;
    const newIdx = (translationIdx + delta + translations.length) % translations.length;
    setTranslationIdx(newIdx);
    setCurrentTranslation(translations[newIdx]);
    setExampleIdx(0);
  }

  function cycleExample(delta) {
    const examples = currentTranslation?.example_en;
    if (!examples || !Array.isArray(examples) || examples.length <= 1) return;
    const newIdx = (exampleIdx + delta + examples.length) % examples.length;
    setExampleIdx(newIdx);
  }

  function handleNext() {
    setWaitingForRetry(false);
    setAnswered(false);
    setIsCorrect(false);
    setSelectedOption(null);
    setWrittenAnswer('');
    setOptions([]);
    selectNextWord();
  }

  function handleWrittenSubmit() {
    const userAnswer = writtenAnswer.trim();
    const correct = currentWord.word_translations.some(
      t => isFuzzyMatch(userAnswer, t.translation_es)
    );

    if (correct) {
      setAnswered(true);
      setIsCorrect(true);
      recordAnswer(true);

      const willBeLast = practicedCount === TOTAL_WORDS - 1;
      if (!willBeLast) {
        setPracticedCount(prev => prev + 1);
      } else {
        setShowFinalize(true);
      }
    } else {
      setWaitingForRetry(true);
      generateOptions();
    }
  }

  function handleQuizAnswer(option) {
    setSelectedOption(option);
    const correct = option === currentTranslation?.translation_es;
    setAnswered(true);
    setIsCorrect(correct);
    recordAnswer(correct);
  
    // Detect if it's the last word
    const willBeLast = practicedCount === TOTAL_WORDS - 1;
  
    if (!willBeLast) {
      setPracticedCount(prev => prev + 1);
    } else {
      setShowFinalize(true);
    }
  }

  function handleFinalize() {
    setSessionComplete(true);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900">No hay palabras para practicar</h2>
        <p className="text-gray-600 mt-2">
          Añade palabras a tu banco para comenzar a practicar
        </p>
      </div>
    );
  }

  if (!canStartPractice) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Necesitas más palabras</h2>
          <p className="text-gray-600">
            Necesitas al menos <strong>5 palabras</strong> en tu banco para iniciar una práctica.
          </p>
          <p className="text-gray-500 mt-2">
            Actualmente tienes <strong>{words.length}</strong> {words.length === 1 ? 'palabra' : 'palabras'}.
          </p>
          <a
            href="/word-bank"
            className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Ir al banco de palabras
          </a>
        </div>
      </div>
    );
  }

  // Session complete
  if (sessionComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">¡Sesión completada!</h2>
          <p className="text-lg text-gray-600">
            Respondiste {practiceStats.total} palabras
          </p>
          <p className="text-2xl font-bold text-indigo-600">
            {practiceStats.correct}/{practiceStats.total} correctas
          </p>
          <button
            onClick={() => {
              resetStats();
              setPracticedCount(0);
              setSessionComplete(false);
              setShowFinalize(false);
              setWaitingForRetry(false);
              setAnswered(false);
              setIsCorrect(false);
              setWrittenAnswer('');
              selectNextWord();
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Practicar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Práctica</h1>
      </div>

      {currentWord && currentTranslation && (
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900">{currentWord.word_en}</h2>
          </div>

          {!answered && !waitingForRetry ? (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 font-medium mb-3">✍️ Escribe la traducción en español:</p>
                <input
                  ref={inputRef}
                  type="text"
                  value={writtenAnswer}
                  onChange={(e) => setWrittenAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && writtenAnswer.trim() && handleWrittenSubmit()}
                  placeholder="Escribe aquí..."
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={handleWrittenSubmit}
                  disabled={!writtenAnswer.trim()}
                  className="mt-3 w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Verificar
                </button>
              </div>
            </>
          ) : !answered && waitingForRetry ? (
            <>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-700 font-semibold text-lg">❌ Incorrecta. Intenta de nuevo:</p>
              </div>
              <div className="space-y-3">
                <p className="text-center text-gray-600 text-sm font-medium">Selecciona la traducción correcta:</p>
                {options.map((option) => (
                  <QuizOption
                    key={option}
                    option={option}
                    onClick={handleQuizAnswer}
                    disabled={false}
                    isCorrect={option === currentTranslation?.translation_es}
                    showResult={false}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-lg text-center ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                {isCorrect ? (
                  <p className="text-green-700 font-semibold text-lg">✅ ¡Correcto!</p>
                ) : (
                  <p className="text-red-700 font-semibold text-lg">❌ Incorrecta</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {currentWord.word_translations.length > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => cycleTranslation(-1)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      aria-label="Traducción anterior"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <p className="text-gray-900 font-medium text-lg">{currentTranslation.translation_es}</p>
                    <button
                      onClick={() => cycleTranslation(1)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      aria-label="Siguiente traducción"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                )}

                {currentWord.word_translations.length <= 1 && (
                  <p className="text-gray-900 font-medium text-lg text-center">{currentTranslation.translation_es}</p>
                )}

                {currentWord.phonetic && (
                  <p className="text-gray-700">
                    <span className="font-medium">🔊 Pronunciación:</span> {currentWord.phonetic}
                  </p>
                )}

                {currentTranslation.example_en && (
                  <div className="flex items-start gap-2">
                    {Array.isArray(currentTranslation.example_en) && currentTranslation.example_en.length > 1 && (
                      <button
                        onClick={() => cycleExample(-1)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors shrink-0 mt-0.5"
                        aria-label="Ejemplo anterior"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                    )}
                    <p className="text-gray-700 flex-1">
                      <span className="font-medium">📝 Frase de uso:</span>{' '}
                      {Array.isArray(currentTranslation.example_en)
                        ? currentTranslation.example_en[exampleIdx]
                        : currentTranslation.example_en}
                      {currentTranslation.example_es && (
                        <span className="text-gray-500"> →{' '}
                          {Array.isArray(currentTranslation.example_es)
                            ? currentTranslation.example_es[exampleIdx]
                            : currentTranslation.example_es}
                        </span>
                      )}
                    </p>
                    {Array.isArray(currentTranslation.example_en) && currentTranslation.example_en.length > 1 && (
                      <button
                        onClick={() => cycleExample(1)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors shrink-0 mt-0.5"
                        aria-label="Siguiente ejemplo"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    )}
                  </div>
                )}

                {currentTranslation.explanation && (
                  <p className="text-gray-700">
                    <span className="font-medium">💡 Contexto:</span> {currentTranslation.explanation}
                  </p>
                )}
              </div>

              {showFinalize ? (
                <button
                  onClick={handleFinalize}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Finalizar
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Siguiente →
                </button>
              )}
            </>
          )}
        </div>
      )}

      {currentWord && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <ProgressBar current={practicedCount} total={TOTAL_WORDS} />
        </div>
      )}
    </div>
  );
}
