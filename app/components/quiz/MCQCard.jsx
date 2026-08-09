'use client';

import { useState } from 'react';

export default function MCQCard({ question, index, onAnswer, disabled }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (optionIndex) => {
    if (disabled) return;
    setSelected(optionIndex);
    onAnswer(question.options[optionIndex].text);
  };

  const getOptionClass = (optionIndex) => {
    const base = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ";
    const isSelected = selected === optionIndex;
    
    if (disabled) {
      if (isSelected) return base + "border-blue-500 bg-blue-50 cursor-default";
      return base + "border-gray-100 bg-gray-50/50 cursor-default opacity-50";
    }

    if (isSelected) {
      return base + "border-blue-500 bg-blue-50 hover:border-blue-600 cursor-pointer text-gray-900 font-medium";
    }

    return base + "border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer bg-white text-gray-700";
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 text-sm font-bold mr-3">
          {index + 1}
        </span>
        {question.question}
      </h3>
      <div className="space-y-2">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={disabled}
            className={getOptionClass(i)}
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm font-medium text-gray-500">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-gray-700">{option.text}</span>
            {selected === i && (
              <span className="ml-auto text-blue-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}