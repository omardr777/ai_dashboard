import React from "react";

interface StatisticsCardsProps {
  stats: {
    total: number;
    labeled: number;
    predicted: number;
    matches: number;
    mismatches: number;
    accuracy: string;
  };
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Trees</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="text-3xl">🌲</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Labeled</p>
            <p className="text-2xl font-bold text-green-600">{stats.labeled}</p>
          </div>
          <div className="text-3xl">🏷️</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">AI Predictions</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.predicted}
            </p>
          </div>
          <div className="text-3xl">🤖</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Mismatches</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.mismatches}
            </p>
          </div>
          <div className="text-3xl">⚠️</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Accuracy</p>
            <p className="text-2xl font-bold text-emerald-600">
              {stats.accuracy}%
            </p>
          </div>
          <div className="text-3xl">📊</div>
        </div>
      </div>
    </div>
  );
};
