import { useState, useEffect } from "react";

interface TrainingProgress {
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMED_OUT" | "ABORTED";
  executionArn?: string;
  progress?: number;
  logs?: string[];
  currentStep?: string;
}

export const useTrainingProgress = (executionArn: string | null) => {
  const [progress, setProgress] = useState<TrainingProgress>({
    status: "RUNNING",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!executionArn) return;

    const pollProgress = async () => {
      try {
        const response = await fetch("/api/training/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ executionArn }),
        });

        const data = await response.json();
        setProgress(data);

        // Stop polling if training is complete
        if (
          ["SUCCEEDED", "FAILED", "TIMED_OUT", "ABORTED"].includes(data.status)
        ) {
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error polling training progress:", error);
      }
    };

    setLoading(true);
    const interval = setInterval(pollProgress, 5000); // Poll every 5 seconds
    pollProgress(); // Initial call

    return () => clearInterval(interval);
  }, [executionArn]);

  return { progress, loading };
};
