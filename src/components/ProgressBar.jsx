const LEVEL_COLORS = [
  { bar: 'bg-gray-400', text: 'text-gray-500', label: 'Nueva' },
  { bar: 'bg-orange-500', text: 'text-orange-600', label: 'Inicial' },
  { bar: 'bg-yellow-500', text: 'text-yellow-600', label: 'En práctica' },
  { bar: 'bg-blue-500', text: 'text-blue-600', label: 'Avanzando' },
  { bar: 'bg-indigo-500', text: 'text-indigo-600', label: 'Consolidada' },
  { bar: 'bg-green-500', text: 'text-green-600', label: 'Dominada' },
];

export default function ProgressBar({ current, total = 5, level }) {
  const isLevelMode = level !== undefined;
  const value = isLevelMode ? level : current;
  const denom = isLevelMode ? 5 : total;
  const percentage = denom > 0 ? (value / denom) * 100 : 0;
  const colors = isLevelMode ? LEVEL_COLORS[level] ?? LEVEL_COLORS[0] : { bar: 'bg-indigo-600', text: 'text-indigo-600' };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className={colors.text}>
          {isLevelMode ? `Nivel ${level}/5` : `Palabra ${current}/${total}`}
        </span>
        {isLevelMode && <span className="text-gray-400">{colors.label}</span>}
        {!isLevelMode && <span className="text-gray-500">{Math.round(percentage)}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colors.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
