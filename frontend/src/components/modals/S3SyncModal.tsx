import React from "react";

interface S3SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketName: string;
  setBucketName: (name: string) => void;
  onSync: (dryRun: boolean) => void;
  syncLoading: boolean;
  syncResults: any;
  syncError: string | null;
  mismatchCount: number;
}

export const S3SyncModal: React.FC<S3SyncModalProps> = ({
  isOpen,
  onClose,
  bucketName,
  setBucketName,
  onSync,
  syncLoading,
  syncResults,
  syncError,
  mismatchCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              🔄 Sync S3 Images
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This will move images from predicted species folders to labeled
              species folders in S3. Found{" "}
              <span className="font-semibold text-orange-600">
                {mismatchCount}
              </span>{" "}
              mismatches to process.
            </p>

            <div className="mb-4">
              <label
                htmlFor="bucketName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                S3 Bucket Name
              </label>
              <input
                id="bucketName"
                type="text"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter S3 bucket name"
              />
            </div>
          </div>

          {syncError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{syncError}</p>
            </div>
          )}

          {syncResults && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                {syncResults.message}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Processed:</span>{" "}
                  {syncResults.processed}
                </div>
                <div>
                  <span className="font-medium">Moved:</span>{" "}
                  {syncResults.moved}
                </div>
                <div>
                  <span className="font-medium">Skipped:</span>{" "}
                  {syncResults.skipped}
                </div>
                <div>
                  <span className="font-medium">Errors:</span>{" "}
                  {syncResults.errors.length}
                </div>
              </div>

              {syncResults.actions?.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-gray-700 mb-2">Actions:</h5>
                  <div className="max-h-40 overflow-y-auto">
                    {syncResults.actions.map((action: any, index: number) => (
                      <div
                        key={index}
                        className="text-xs text-gray-600 py-1 border-b border-gray-200"
                      >
                        <span className="font-medium">
                          Tree {action.tree_id}:
                        </span>{" "}
                        {action.image_name} -
                        <span className="text-blue-600">
                          {" "}
                          {action.predicted_species}
                        </span>{" "}
                        →
                        <span className="text-green-600">
                          {" "}
                          {action.labeled_species}
                        </span>
                        <span className="ml-2 text-gray-500">
                          ({action.action})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSync(true)}
              disabled={syncLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 transition-colors"
            >
              {syncLoading ? "Running..." : "🔍 Dry Run"}
            </button>
            <button
              onClick={() => onSync(false)}
              disabled={syncLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
            >
              {syncLoading ? "Syncing..." : "🚀 Sync Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
