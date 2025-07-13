const express = require("express");
const AWS = require("aws-sdk");
const router = express.Router();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const stepfunctions = new AWS.StepFunctions();
const cloudwatchlogs = new AWS.CloudWatchLogs();

// Get training progress from Step Functions
router.post("/progress", async (req, res) => {
  try {
    const { executionArn } = req.body;

    if (!executionArn) {
      return res.status(400).json({ error: "executionArn is required" });
    }

    // Get execution status
    const execution = await stepfunctions
      .describeExecution({
        executionArn: executionArn,
      })
      .promise();

    // Get execution history for detailed progress
    const history = await stepfunctions
      .getExecutionHistory({
        executionArn: executionArn,
        maxResults: 100,
        reverseOrder: true,
      })
      .promise();

    // Parse current step and progress
    let currentStep = null;
    let progress = 0;

    for (const event of history.events) {
      if (event.type === "TaskStateEntered") {
        currentStep = event.stateEnteredEventDetails.name;
        break;
      }
    }

    // Calculate progress based on completed steps
    const totalSteps = 5; // Adjust based on your pipeline
    const completedSteps = history.events.filter(
      (e) => e.type === "TaskStateExited"
    ).length;
    progress = Math.min((completedSteps / totalSteps) * 100, 100);

    res.json({
      status: execution.status,
      currentStep: currentStep,
      progress: progress,
      startDate: execution.startDate,
      logs: [],
    });
  } catch (error) {
    console.error("Error getting training progress:", error);
    res.status(500).json({
      error: "Failed to get training progress",
      details: error.message,
    });
  }
});

// Get training logs from CloudWatch
router.post("/logs", async (req, res) => {
  try {
    const { logGroupName, logStreamName, nextToken } = req.body;

    if (!logGroupName || !logStreamName) {
      return res
        .status(400)
        .json({ error: "logGroupName and logStreamName are required" });
    }

    const params = {
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      startFromHead: true,
    };

    if (nextToken) {
      params.nextToken = nextToken;
    }

    const response = await cloudwatchlogs.getLogEvents(params).promise();

    res.json({
      events: response.events,
      nextForwardToken: response.nextForwardToken,
      nextBackwardToken: response.nextBackwardToken,
    });
  } catch (error) {
    console.error("Error getting training logs:", error);
    res.status(500).json({
      error: "Failed to get training logs",
      details: error.message,
    });
  }
});

module.exports = router;
