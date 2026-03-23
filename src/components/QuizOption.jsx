export default function QuizOption({ option, onClick, disabled, isCorrect, showResult }) {
  const getStyles = () => {
    if (!showResult) {
      return 'bg-white hover:bg-indigo-50 border-gray-200 hover:border-indigo-300';
    }
    if (isCorrect) {
      return 'bg-green-50 border-green-500 text-green-700';
    }
    return 'bg-gray-50 border-gray-200 text-gray-400';
  };

  return (
    <button
      onClick={() => onClick(option)}
      disabled={disabled}
      className={`w-full p-4 text-left border-2 rounded-lg transition-all ${getStyles()} ${
        !disabled && !showResult ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {option}
    </button>
  );
}
