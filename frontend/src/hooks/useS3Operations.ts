import { useState, useCallback } from "react";
import { api } from "../services/api";

export const useS3Operations = (bucketName: string) => {
  // S3 Sync state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Debug state
  const [debugData, setDebugData] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  // S3 Structure state
  const [s3Structure, setS3Structure] = useState<any>(null);
  const [s3Loading, setS3Loading] = useState(false);

  // S3 Connection test state
  const [s3TestLoading, setS3TestLoading] = useState(false);
  const [s3TestResults, setS3TestResults] = useState<any>(null);

  // S3 Sync operations
  const handleSyncS3 = useCallback(
    async (dryRun: boolean = false) => {
      if (!bucketName.trim()) {
        setSyncError("Please enter a bucket name");
        return;
      }

      setSyncLoading(true);
      setSyncError(null);
      setSyncResults(null);

      try {
        const results = await api.syncS3(bucketName.trim(), dryRun);
        setSyncResults(results);
        return results;
      } catch (err) {
        setSyncError(err instanceof Error ? err.message : "Failed to sync S3");
        throw err;
      } finally {
        setSyncLoading(false);
      }
    },
    [bucketName]
  );

  const resetSyncState = useCallback(() => {
    setSyncResults(null);
    setSyncError(null);
  }, []);

  // Debug operations
  const handleDebugPredictions = useCallback(async () => {
    setDebugLoading(true);
    try {
      const data = await api.getDebugPredictions();
      setDebugData(data);
      return data;
    } catch (err) {
      console.error("Debug error:", err);
      throw err;
    } finally {
      setDebugLoading(false);
    }
  }, []);

  const resetDebugState = useCallback(() => {
    setDebugData(null);
  }, []);

  // S3 Structure operations
  const handleCheckS3Structure = useCallback(async () => {
    if (!bucketName.trim()) {
      throw new Error("Please enter a bucket name first");
    }

    setS3Loading(true);
    try {
      const data = await api.getS3Structure(bucketName.trim());
      setS3Structure(data);
      return data;
    } catch (err) {
      console.error("S3 structure error:", err);
      throw err;
    } finally {
      setS3Loading(false);
    }
  }, [bucketName]);

  const resetS3StructureState = useCallback(() => {
    setS3Structure(null);
  }, []);

  // S3 Connection test operations
  const handleTestS3Connection = useCallback(async () => {
    if (!bucketName.trim()) {
      throw new Error("Please enter a bucket name first");
    }

    setS3TestLoading(true);
    setS3TestResults(null);
    try {
      const result = await api.testS3Connection(bucketName.trim());
      setS3TestResults(result);
      return result;
    } catch (err) {
      console.error("S3 connection test error:", err);
      const errorResult = {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        test: "api_call",
      };
      setS3TestResults(errorResult);
      return errorResult;
    } finally {
      setS3TestLoading(false);
    }
  }, [bucketName]);

  const resetS3TestState = useCallback(() => {
    setS3TestResults(null);
  }, []);

  return {
    // Sync operations
    syncLoading,
    syncResults,
    syncError,
    handleSyncS3,
    resetSyncState,

    // Debug operations
    debugData,
    debugLoading,
    handleDebugPredictions,
    resetDebugState,

    // S3 Structure operations
    s3Structure,
    s3Loading,
    handleCheckS3Structure,
    resetS3StructureState,

    // S3 Test operations
    s3TestLoading,
    s3TestResults,
    handleTestS3Connection,
    resetS3TestState,
  };
};
