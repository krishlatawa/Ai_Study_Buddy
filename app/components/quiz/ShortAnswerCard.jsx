'use client';

import { useState } from 'react';

export default function ShortAnswerCard({ question, index, onAnswer, disabled }) {
  const [answer, setAnswer] = useState('');

  const handleChange = (e) => {
    setAnswer(e.target.value);
    onAnswer(e.target.value);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 text-sm font-bold mr-3">
          {index + 1}
        </span>
        {question.question}
      </h3>
      <textarea
        value={answer}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Type your answer here..."
        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none resize-y min-h-[120px] text-gray-700 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
      />
      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Self-check: Compare with your notes after submitting
      </p>
    </div>
  );
}