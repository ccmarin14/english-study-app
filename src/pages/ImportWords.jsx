import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { parseImportFile, groupByWord, importWords, downloadTemplate } from '../lib/importWords';

export default function ImportWords() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);
    setResults(null);

    try {
      const rows = await parseImportFile(file);
      const grouped = groupByWord(rows);
      setPreview(grouped);
    } catch (err) {
      setError('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || !user) return;

    setLoading(true);
    setError('');

    const importResults = await importWords(user.id, preview);
    setResults(importResults);
    setPreview(null);
    setLoading(false);
  };

  const handleReset = () => {
    setPreview(null);
    setResults(null);
    setError('');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Importar palabras</h1>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
          >
            📥 Descargar plantilla
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Instrucciones</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Descarga la plantilla Excel</li>
            <li>Completa las columnas: word_en, phonetic, translation_es, example_en, example_es, explanation</li>
            <li>Las columnas word_en y translation_es son obligatorias</li>
            <li>Guarda el archivo y súbelo aquí</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        )}

        {results && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-800 mb-4">✓ Importación completada</h2>
            <div className="space-y-2 text-green-700">
              <p>📄 Filas procesadas: {results.rowsProcessed}</p>
              <p>📚 Palabras creadas: {results.wordsCreated}</p>
              <p>🔄 Traducciones añadidas: {results.translationsAdded}</p>
              <p>⏭️ Filas omitidas: {results.rowsSkipped}</p>
            </div>
            <button
              onClick={() => navigate('/word-bank')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Ver banco de palabras
            </button>
          </div>
        )}

        {!preview && !results && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block">
              <span className="text-gray-700 font-medium">Seleccionar archivo Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="mt-2 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
            </label>
            {loading && (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            )}
          </div>
        )}

        {preview && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Vista previa</h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p>📄 Total de filas: {preview.totalRows}</p>
              <p>📚 Palabras encontradas: {preview.words.length}</p>
              <p>⚠️ Filas omitidas: {preview.skippedRows}</p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {preview.words.slice(0, 10).map((word, index) => (
                <div key={index} className="border-b border-gray-200 py-3">
                  <h3 className="font-medium text-gray-900">{word.word_en}</h3>
                  {word.phonetic && (
                    <p className="text-sm text-gray-500">{word.phonetic}</p>
                  )}
                  <p className="text-sm text-indigo-600 mt-1">
                    {word.translations.map(t => t.translation_es).join(', ')}
                  </p>
                </div>
              ))}
              {preview.words.length > 10 && (
                <p className="text-center text-gray-500 py-2">
                  ... y {preview.words.length - 10} palabras más
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
