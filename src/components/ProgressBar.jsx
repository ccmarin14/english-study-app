export default function ProgressBar({ current, total = 5 }) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Palabra {current}/{total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300 bg-indigo-600"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
