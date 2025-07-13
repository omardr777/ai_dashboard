const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

// Import configurations
const swaggerSpec = require("./config/swagger");
require("./config/aws"); // Initialize AWS config

// Import middleware
const { requestLogger } = require("./middleware/logging");
const { log } = require("./middleware/logging");

// Import routes
const treesRoutes = require("./routes/trees");
const speciesRoutes = require("./routes/species");
const versioningRoutes = require("./routes/versioning");
const trainingRoutes = require("./routes/training");

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(
  cors({
    origin: "*", // Configure this properly for production
    credentials: true,
  })
);
app.use(express.json());

// Request logging middleware
app.use(requestLogger);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get API information
 *     description: Returns basic information about the Netzero Trees API
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Netzero Trees API - Express Version"
 */
app.get("/", (req, res) => {
  res.json({ message: "Netzero Trees API - Express Version" });
});

// Routes
app.use("/trees", treesRoutes);
app.use("/species", speciesRoutes);
app.use("/versioning", versioningRoutes);
app.use("/api/training", trainingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  log.error("Unexpected error occurred", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  log.success(`Server running on http://0.0.0.0:${PORT}`);
  log.info(`Swagger docs available at http://0.0.0.0:${PORT}/api-docs`);
  log.info("API endpoints:", {
    root: "GET /",
    trees: "GET /trees",
    species: "GET /species",
    updateTreeSpecies: "PUT /trees/:tree_id/species",
    syncS3: "POST /versioning/sync-s3",
  });
});
