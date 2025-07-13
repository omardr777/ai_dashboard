import React, { useState } from "react";
import { useTreeData } from "../hooks/useTreeData";
import { useS3Operations } from "../hooks/useS3Operations";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorDisplay } from "./ErrorDisplay";
import { DashboardHeader } from "./DashboardHeader";
import { StatisticsCards } from "./StatisticsCards";
import { TreeGrid } from "./TreeGrid";
import { S3SyncModal } from "./modals/S3SyncModal";
import { S3StructureModal } from "./modals/S3StructureModal";
import { TrainingModal } from "./modals/TrainingModal";

export const TreeDashboard: React.FC = () => {
  const [bucketName, setBucketName] = useState("retrain-cls");

  // Modal states
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showS3Modal, setShowS3Modal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  // Training states
  const [trainingLoading, setTrainingLoading] = useState(false);

  // Custom hooks
  const {
    trees,
    species,
    loading,
    error,
    stats,
    handleSpeciesUpdate,
    refreshTrees,
    retryFetch,
  } = useTreeData();

  const {
    syncLoading,
    syncResults,
    syncError,
    handleSyncS3,
    resetSyncState,
    debugData,
    s3Structure,
    resetS3StructureState,
  } = useS3Operations(bucketName);

  // Event handlers

  const handleSyncS3Click = () => {
    setShowSyncModal(true);
  };

  const handleSync = async (dryRun: boolean) => {
    try {
      const results = await handleSyncS3(dryRun);
      // If it was a real sync (not dry run), refresh the trees data
      if (!dryRun && results && results.moved > 0) {
        await refreshTrees();
      }
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const handleCloseSyncModal = () => {
    setShowSyncModal(false);
    resetSyncState();
  };

  const handleCloseS3Modal = () => {
    setShowS3Modal(false);
    resetS3StructureState();
  };

  const handleTrainClick = async () => {
    setShowTrainingModal(true);
  };

  const handleStartTraining = async (params: {
    epochs: number;
    imgsz: number;
    batch_size: number;
  }) => {
    setTrainingLoading(true);
    try {
      const response = await fetch(
        "https://ydbmp4osr0.execute-api.us-east-1.amazonaws.com/YoloCls_Training",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Training request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Training started:", result);

      // Return the execution ARN and log stream name if available
      return {
        executionArn: result.executionArn,
        logStreamName: result.logStreamName,
      };
    } catch (err) {
      console.error("Training error:", err);
      throw err;
    } finally {
      setTrainingLoading(false);
    }
  };

  const handleCloseTrainingModal = () => {
    setShowTrainingModal(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={retryFetch} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader
          onTrainClick={handleTrainClick}
          onSyncS3Click={handleSyncS3Click}
          trainingLoading={trainingLoading}
          mismatchCount={stats.mismatches}
        />

        <StatisticsCards stats={stats} />

        <TreeGrid
          trees={trees}
          species={species}
          onSpeciesUpdate={handleSpeciesUpdate}
        />

        {/* Modals */}
        <S3SyncModal
          isOpen={showSyncModal}
          onClose={handleCloseSyncModal}
          bucketName={bucketName}
          setBucketName={setBucketName}
          onSync={handleSync}
          syncLoading={syncLoading}
          syncResults={syncResults}
          syncError={syncError}
          mismatchCount={stats.mismatches}
        />

        <S3StructureModal
          isOpen={showS3Modal}
          onClose={handleCloseS3Modal}
          s3Structure={s3Structure}
          debugData={debugData}
        />

        <TrainingModal
          isOpen={showTrainingModal}
          onClose={handleCloseTrainingModal}
          onStartTraining={handleStartTraining}
          trainingLoading={trainingLoading}
        />
      </div>
    </div>
  );
};
