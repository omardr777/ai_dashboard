import type { Tree, Species, UpdateSpeciesRequest } from "../types";

const API_BASE_URL = "http://localhost:8001";

// TODO: Replace with your actual S3 bucket URL
// Example: 'https://your-bucket-name.s3.amazonaws.com'
// or 'https://your-bucket-name.s3.region.amazonaws.com'
const S3_BUCKET_URL =
  import.meta.env.VITE_S3_BUCKET_URL ||
  "https://retrain-cls.s3.us-east-1.amazonaws.com/images2";

export const api = {
  // Get all trees
  getTrees: async (): Promise<Tree[]> => {
    const response = await fetch(`${API_BASE_URL}/trees`);
    if (!response.ok) {
      throw new Error("Failed to fetch trees");
    }
    return response.json();
  },

  // Get all species
  getSpecies: async (): Promise<Species[]> => {
    const response = await fetch(`${API_BASE_URL}/species`);
    if (!response.ok) {
      throw new Error("Failed to fetch species");
    }
    return response.json();
  },

  // Update tree species
  updateTreeSpecies: async (
    treeId: number,
    updateData: UpdateSpeciesRequest
  ): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/trees/${treeId}/species`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update tree species");
    }
  },

  // Get S3 image URL
  getImageUrl: (
    imageName: string,
    compressed: boolean = false,
    specie: string = ""
  ): string => {
    if (!imageName) return "";

    // Use compressed version if available and requested
    const imageToUse =
      compressed && imageName.includes(".")
        ? imageName.replace(/\.[^/.]+$/, "_compressed$&")
        : imageName;

    const fullUrl = `${S3_BUCKET_URL}/${specie}/${imageToUse}`;
    console.log("Generated image URL:", fullUrl);
    return fullUrl;
  },

  // Test S3 bucket access
  testS3Access: async (imageName: string, specie: string): Promise<boolean> => {
    try {
      const imageUrl = `${S3_BUCKET_URL}/${specie}/${imageName}`;
      console.log("Testing S3 access for:", imageUrl);

      // Try with no-cors mode to bypass CORS for testing
      const response = await fetch(imageUrl, {
        method: "HEAD",
        mode: "no-cors",
      });
      console.log("S3 Response status:", response.status);
      console.log("S3 Response type:", response.type);

      // With no-cors, we can't read the status, but if it doesn't throw, it probably worked
      return response.type === "opaque";
    } catch (error) {
      console.error("S3 Access test failed:", error);
      return false;
    }
  },

  // Sync S3 images based on predictions
  syncS3: async (
    bucket: string,
    dryRun: boolean = false
  ): Promise<{
    message: string;
    processed: number;
    moved: number;
    skipped: number;
    errors: Array<{
      tree_id: number;
      image_name: string;
      error: string;
    }>;
    actions: Array<{
      tree_id: number;
      image_name: string;
      from: string;
      to: string;
      predicted_species: string;
      labeled_species: string;
      action: string;
    }>;
  }> => {
    const response = await fetch(
      `${API_BASE_URL}/versioning/sync-s3?bucket=${encodeURIComponent(
        bucket
      )}&dryRun=${dryRun}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to sync S3 images");
    }

    return response.json();
  },

  // Debug endpoint to check predictions data
  getDebugPredictions: async (): Promise<{
    stats: {
      total: number;
      matches: number;
      mismatches: number;
      unknown: number;
    };
    predictions: Array<{
      tree_id: number;
      predicted_specie_id: number;
      labeled_specie_id: number;
      predicted_common_name: string;
      labeled_common_name: string;
      image_name: string;
      compressed_image_name: string;
      match_status: string;
      predicted_folder: string;
      labeled_folder: string;
      folder_same: boolean;
    }>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/debug/predictions`);
    if (!response.ok) {
      throw new Error("Failed to fetch debug predictions");
    }
    return response.json();
  },

  // Debug S3 bucket structure
  getS3Structure: async (
    bucket: string,
    prefix: string = "images2"
  ): Promise<{
    bucket: string;
    prefix: string;
    folders: string[];
    files: Array<{
      key: string;
      size: number;
      lastModified: string;
    }>;
    totalFiles: number;
    totalFolders: number;
    isTruncated: boolean;
  }> => {
    const response = await fetch(
      `${API_BASE_URL}/debug/s3-structure?bucket=${encodeURIComponent(
        bucket
      )}&prefix=${encodeURIComponent(prefix)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch S3 structure");
    }
    return response.json();
  },

  // Test basic S3 connection
  testS3Connection: async (
    bucket: string
  ): Promise<{
    success: boolean;
    bucketAccessible?: boolean;
    totalObjects?: number;
    sampleObjects?: Array<{
      key: string;
      size: number;
      lastModified: string;
    }>;
    message?: string;
    error?: string;
    errorCode?: string;
    test?: string;
  }> => {
    const response = await fetch(
      `${API_BASE_URL}/debug/test-s3-access?bucket=${encodeURIComponent(
        bucket
      )}`
    );
    if (!response.ok) {
      throw new Error("Failed to test S3 access");
    }
    return response.json();
  },
};
