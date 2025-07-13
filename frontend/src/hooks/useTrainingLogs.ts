import { useState, useEffect } from "react";

export const useTrainingLogs = (
  logGroupName: string,
  logStreamName: string
) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);

  useEffect(() => {
    if (!logGroupName || !logStreamName) return;

    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/training/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logGroupName,
            logStreamName,
            nextToken,
          }),
        });

        const data = await response.json();
        setLogs((prev) => [...prev, ...data.events.map((e: any) => e.message)]);
        setNextToken(data.nextForwardToken);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    const interval = setInterval(fetchLogs, 3000);
    fetchLogs();

    return () => clearInterval(interval);
  }, [logGroupName, logStreamName, nextToken]);

  return logs;
};
