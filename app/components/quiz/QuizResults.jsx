export default function QuizResults({ result, onRetry, onBack }) {
  const { score, totalQuestions, xpEarned, baseXP, bonusXP, percentage, answers } = result;

  const getMessage = () => {
    if (percentage >= 80) return { text: '🎉 Outstanding! You mastered this!', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 60) return { text: '👍 Good work! Keep it up!', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 40) return { text: '📚 Getting there! Review and retry.', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { text: '💪 Keep studying! Practice makes perfect.', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const msg = getMessage();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
        <p className="text-gray-500 mb-8">{msg.text}</p>
        
        {/* Score Circle */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="70" stroke="#e5e7eb" strokeWidth="12" fill="none" />
            <circle 
              cx="80" cy="80" r="70" 
              stroke={percentage >= 60 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444'} 
              strokeWidth="12" 
              fill="none"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentage / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${msg.color}`}>{percentage}%</span>
            <span className="text-sm text-gray-400">{score}/{totalQuestions}</span>
          </div>
        </div>

        {/* XP Earned Banner */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 mb-6 text-white">
          <div className="text-sm font-medium opacity-90">XP Earned</div>
          <div className="text-3xl font-bold">+{xpEarned} XP</div>
          {bonusXP > 0 && (
            <div className="text-xs mt-1 opacity-80">Includes +{bonusXP} speed bonus!</div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">{score}</div>
            <div className="text-xs text-gray-500 font-medium">Correct</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-600">{totalQuestions - score}</div>
            <div className="text-xs text-gray-500 font-medium">Incorrect</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">{baseXP}</div>
            <div className="text-xs text-gray-500 font-medium">Base XP</div>
          </div>
        </div>

        {/* Answer Review */}
        <div className="text-left mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Answer Review</h3>
          <div className="space-y-2">
            {answers.map((ans, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${ans.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${ans.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {ans.isCorrect ? '✓' : '✗'}
                </span>
                <span className="text-sm text-gray-700 flex-1">Question {i + 1}</span>
                <span className={`text-xs font-medium ${ans.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {ans.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            All Quizzes
          </button>
        </div>
      </div>
    </div>
  );
}