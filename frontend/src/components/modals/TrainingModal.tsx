import React, { useState, useEffect } from "react";
import { X, Play, Clock, CheckCircle } from "lucide-react";
import { useTrainingProgress } from "../../hooks/useTrainingProgress";

interface TrainingParams {
  epochs: number;
  imgsz: number;
  batch_size: number;
}

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTraining: (
    params: TrainingParams
  ) => Promise<{ executionArn?: string; logStreamName?: string }>;
  trainingLoading: boolean;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  onStartTraining,
  trainingLoading,
}) => {
  const [params, setParams] = useState<TrainingParams>({
    epochs: 10,
    imgsz: 640,
    batch_size: 32,
  });

  const [executionArn, setExecutionArn] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Use real AWS progress tracking
  const { progress: trainingProgress } = useTrainingProgress(executionArn);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleStartTraining = async () => {
    try {
      const response = await onStartTraining(params);
      if (response?.executionArn) {
        setExecutionArn(response.executionArn);
        setToastMessage("Training started successfully!");
        setToastType("success");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Training start error:", error);
      setToastMessage("Failed to start training. Please try again.");
      setToastType("error");
      setShowToast(true);
    }
  };

  const handleParamChange = (key: keyof TrainingParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  // Map AWS status to display status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "RUNNING":
        return "bg-yellow-500";
      case "SUCCEEDED":
        return "bg-green-500";
      case "FAILED":
      case "TIMED_OUT":
      case "ABORTED":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 right-4 z-60 ${
            toastType === "success" ? "bg-green-500" : "bg-red-500"
          } text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transition-all duration-300 transform translate-y-0 opacity-100`}
        >
          <CheckCircle size={20} />
          <span>{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 text-white hover:text-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Training Pipeline
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Parameters Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Hyperparameters
              </h3>

              {/* Epochs */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Epochs
                </label>
                <input
                  type="number"
                  value={params.epochs}
                  onChange={(e) =>
                    handleParamChange("epochs", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1000"
                  disabled={trainingLoading}
                />
              </div>

              {/* Image Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Size
                </label>
                <select
                  value={params.imgsz}
                  onChange={(e) =>
                    handleParamChange("imgsz", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={trainingLoading}
                >
                  <option value={416}>416</option>
                  <option value={512}>512</option>
                  <option value={640}>640</option>
                  <option value={768}>768</option>
                  <option value={1024}>1024</option>
                </select>
              </div>

              {/* Batch Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Size
                </label>
                <select
                  value={params.batch_size}
                  onChange={(e) =>
                    handleParamChange("batch_size", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={trainingLoading}
                >
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                  <option value={64}>64</option>
                  <option value={128}>128</option>
                </select>
              </div>
            </div>

            {/* Training Controls */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Controls
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={handleStartTraining}
                  disabled={
                    trainingLoading ||
                    (executionArn !== null &&
                      trainingProgress.status === "RUNNING")
                  }
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={16} className="mr-2" />
                  Start Training
                </button>
              </div>
            </div>

            {/* Training Status */}
            {executionArn && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Status
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(
                        trainingProgress.status
                      )}`}
                    ></div>
                    <span className="text-sm font-medium capitalize">
                      {trainingProgress.status.toLowerCase()}
                    </span>
                  </div>

                  {trainingProgress.status === "RUNNING" && (
                    <>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {trainingProgress.progress?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${trainingProgress.progress || 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {trainingProgress.currentStep && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={14} className="mr-1" />
                          <span>
                            Current Step: {trainingProgress.currentStep}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
