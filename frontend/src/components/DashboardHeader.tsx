import React from "react";

interface DashboardHeaderProps {
  onTrainClick: () => Promise<void>;
  onSyncS3Click: () => void;
  trainingLoading: boolean;
  mismatchCount: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onTrainClick,
  onSyncS3Click,
  trainingLoading,
  mismatchCount,
}) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            🌳 Tree Species Dashboard
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onTrainClick}
            disabled={trainingLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            {trainingLoading ? "Training..." : "🚀 Train"}
          </button>
          <button
            onClick={onSyncS3Click}
            disabled={mismatchCount === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            🔄 Sync S3 Images
            {mismatchCount > 0 && (
              <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                {mismatchCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
