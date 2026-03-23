export default function ProgressBar({ level, maxLevel = 5 }) {
  const percentage = (level / maxLevel) * 100;

  const getColor = () => {
    if (level <= 1) return 'bg-red-500';
    if (level <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Nivel {level}/{maxLevel}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
