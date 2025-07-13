import React from "react";

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-red-600 mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
          {error}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );
};
