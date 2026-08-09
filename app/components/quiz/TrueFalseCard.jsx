'use client';

import { useState } from 'react';

export default function TrueFalseCard({ question, index, onAnswer, disabled }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (value) => {
    if (disabled) return;
    setSelected(value);
    onAnswer(value);
  };

  const getButtonClass = (value) => {
    const base = "flex-1 py-4 px-6 rounded-xl border-2 font-semibold transition-all duration-200 ";
    const isSelected = selected === value;
    
    if (disabled) {
      if (isSelected) return base + "border-purple-500 bg-purple-50 text-purple-700 cursor-default";
      return base + "border-gray-100 bg-gray-50/50 text-gray-400 cursor-default opacity-50";
    }

    if (isSelected) {
      return base + "border-purple-500 bg-purple-50 text-purple-700 hover:border-purple-600 cursor-pointer";
    }

    return base + "border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer bg-white text-gray-700";
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700 text-sm font-bold mr-3">
          {index + 1}
        </span>
        {question.question}
      </h3>
      <div className="flex gap-3">
        <button
          onClick={() => handleSelect(true)}
          disabled={disabled}
          className={getButtonClass(true)}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            True
          </div>
        </button>
        <button
          onClick={() => handleSelect(false)}
          disabled={disabled}
          className={getButtonClass(false)}
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            False
          </div>
        </button>
      </div>
    </div>
  );
}