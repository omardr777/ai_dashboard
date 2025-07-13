import React from "react";

interface S3StructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  s3Structure: any;
  debugData?: any;
}

export const S3StructureModal: React.FC<S3StructureModalProps> = ({
  isOpen,
  onClose,
  s3Structure,
  debugData,
}) => {
  if (!isOpen || !s3Structure) return null;

  const getExpectedFolders = () => {
    if (debugData?.predictions) {
      return Array.from(
        new Set(
          debugData.predictions
            .filter((p: any) => p.match_status === "mismatch")
            .flatMap((p: any) => [
              p.predicted_common_name,
              p.labeled_common_name,
            ])
            .filter(Boolean)
        )
      ) as string[];
    }
    return [
      "Azadirachta indica",
      "Ficus religiosa",
      "Ziziphus spina-christi",
      "Acasia",
      "Vachellia tortilis",
      "Tamarix aphylla",
      "Poinciana",
      "Plumeria alba",
    ];
  };

  const expectedFolders = getExpectedFolders();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              📁 S3 Structure: {s3Structure.bucket}/{s3Structure.prefix}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* S3 Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">Total Folders</h4>
              <p className="text-2xl font-bold text-purple-600">
                {s3Structure.totalFolders}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Total Files</h4>
              <p className="text-2xl font-bold text-blue-600">
                {s3Structure.totalFiles}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800">Truncated</h4>
              <p className="text-2xl font-bold text-gray-600">
                {s3Structure.isTruncated ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {/* Expected vs Actual Folders */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              🔍 Expected Folders (from predictions):
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {expectedFolders.map((folder: string) => (
                <div
                  key={folder}
                  className={`p-2 rounded text-sm ${
                    s3Structure.folders.includes(folder)
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {folder} {s3Structure.folders.includes(folder) ? "✅" : "❌"}
                </div>
              ))}
            </div>
          </div>

          {/* Actual Folders */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              📁 Actual Folders in S3:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {s3Structure.folders.map((folder: string) => (
                <div key={folder} className="p-2 bg-gray-100 rounded text-sm">
                  {folder}
                </div>
              ))}
            </div>
            {s3Structure.folders.length === 0 && (
              <p className="text-gray-500 italic">No folders found</p>
            )}
          </div>

          {/* Sample Files */}
          {s3Structure.files.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                📄 Sample Files:
              </h4>
              <div className="max-h-40 overflow-y-auto">
                {s3Structure.files.map((file: any) => (
                  <div
                    key={file.key}
                    className="p-2 border-b border-gray-200 text-sm"
                  >
                    <div className="font-mono text-gray-700">{file.key}</div>
                    <div className="text-gray-500 text-xs">
                      {Math.round(file.size / 1024)} KB -{" "}
                      {new Date(file.lastModified).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
