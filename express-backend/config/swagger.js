const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Netzero Trees API",
      version: "1.0.0",
      description:
        "API for managing trees and species data in the Netzero project",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8001}`,
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Tree: {
          type: "object",
          properties: {
            tree_id: {
              type: "integer",
              description: "Unique identifier for the tree",
            },
            image_name: {
              type: "string",
              description: "Name of the tree image",
            },
            compressed_image_name: {
              type: "string",
              description: "Name of the compressed tree image",
            },
            predicted_specie_id: {
              type: "integer",
              description: "ID of the AI predicted species",
            },
            predicted_common_name: {
              type: "string",
              description: "Common name of the AI predicted species",
            },
            labeled_specie_id: {
              type: "integer",
              description: "ID of the labeled/ground truth species",
            },
            labeled_common_name: {
              type: "string",
              description: "Common name of the labeled/ground truth species",
            },
          },
        },
        Species: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Unique identifier for the species",
            },
            common_name: {
              type: "string",
              description: "Common name of the species",
            },
          },
        },
        UpdateSpeciesRequest: {
          type: "object",
          required: [
            "predicted_specie_id",
            "labeled_specie_id",
            "model_name",
            "model_version",
          ],
          properties: {
            predicted_specie_id: {
              type: "integer",
              description: "ID of the predicted species",
            },
            labeled_specie_id: {
              type: "integer",
              description: "ID of the labeled species",
            },
            model_name: {
              type: "string",
              description: "Name of the ML model used",
            },
            model_version: {
              type: "string",
              description: "Version of the ML model used",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
