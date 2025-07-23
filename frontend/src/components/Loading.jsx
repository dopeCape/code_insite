import React from 'react';
import { Brain } from 'lucide-react';

const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-6">
          <div className="relative">
            <div className="p-4 bg-primary-600 rounded-xl animate-pulse-slow">
              <Brain className="w-12 h-12 text-white" />
            </div>
            {/* Spinning Ring */}
            <div className="absolute inset-0 rounded-xl border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">CodeInsight AI</h2>
        <p className="text-gray-600 animate-pulse">{message}</p>

        {/* Loading Dots */}
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
