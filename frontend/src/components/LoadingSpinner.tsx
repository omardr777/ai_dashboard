import React from "react";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">🌲 Loading trees...</p>
        <p className="text-gray-500 text-sm mt-2">
          Please wait while we fetch the data
        </p>
      </div>
    </div>
  );
};
