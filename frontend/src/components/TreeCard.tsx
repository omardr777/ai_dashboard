import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Tree, Species } from "../types";
import { api } from "../services/api";

interface TreeCardProps {
  tree: Tree;
  species: Species[];
  onSpeciesUpdate: (treeId: number, newSpeciesId: number) => void;
}

export const TreeCard: React.FC<TreeCardProps> = React.memo(
  ({ tree, species, onSpeciesUpdate }) => {
    const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(
      tree.labeled_specie_id?.toString() || ""
    );
    const [isUpdating, setIsUpdating] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Memoize species options for better performance
    const speciesOptions = useMemo(
      () =>
        species.map((specie) => ({
          id: specie.id,
          label: specie.common_name,
          value: specie.id.toString(),
        })),
      [species]
    );

    // Test S3 access on mount
    useEffect(() => {
      if (tree.image_name && tree.labeled_common_name) {
        api
          .testS3Access(tree.image_name, tree.labeled_common_name)
          .then((success) => {
            console.log(`S3 access test for tree ${tree.tree_id}:`, success);
          });
      }
    }, [tree.tree_id, tree.image_name, tree.labeled_common_name]);

    const handleUpdateSpecies = useCallback(async () => {
      if (parseInt(selectedSpeciesId) === tree.labeled_specie_id) {
        return; // No change needed
      }

      setIsUpdating(true);
      try {
        await api.updateTreeSpecies(tree.tree_id, {
          predicted_specie_id: tree.predicted_specie_id || 0, // Provide fallback for null
          labeled_specie_id: parseInt(selectedSpeciesId), // New species as labeled
          model_name: "manual_update", // Placeholder for model name
          model_version: "1.0", // Placeholder for model version
        });

        onSpeciesUpdate(tree.tree_id, parseInt(selectedSpeciesId));
      } catch (error) {
        console.error("Failed to update species:", error);
        // Reset selection on error
        setSelectedSpeciesId(tree.labeled_specie_id?.toString() || "");
      } finally {
        setIsUpdating(false);
      }
    }, [
      selectedSpeciesId,
      tree.labeled_specie_id,
      tree.predicted_specie_id,
      tree.tree_id,
      onSpeciesUpdate,
    ]);

    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    // Check if prediction matches label
    const isPredictionCorrect =
      tree.predicted_specie_id === tree.labeled_specie_id;
    const hasLabel = tree.labeled_specie_id !== null;
    const hasPrediction = tree.predicted_specie_id !== null;

    return (
      <Card className="w-full max-w-md mx-auto bg-white border-gray-200 hover:shadow-xl transition-all duration-300 hover:border-gray-300">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Tree #{tree.tree_id}
            </CardTitle>
            {hasLabel && hasPrediction && (
              <Badge
                variant={isPredictionCorrect ? "default" : "destructive"}
                className={`text-xs font-medium ${
                  isPredictionCorrect
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }`}
              >
                {isPredictionCorrect ? "Correct" : "Needs Review"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Tree Image */}
          <div className="aspect-square relative overflow-hidden rounded-xl bg-gray-50 border border-gray-200">
            {!imageError ? (
              <img
                src={api.getImageUrl(
                  tree.compressed_image_name || tree.image_name,
                  true,
                  tree.labeled_common_name || ""
                )}
                alt={`Tree ${tree.tree_id} - ${
                  tree.labeled_common_name || "Unknown"
                }`}
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                onError={handleImageError}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">
                    Image not available
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Species Information */}
          <div className="space-y-4">
            {/* Current Label & AI Prediction */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="text-xl">🏷️</div>
                </div>
                <p className="text-lg font-semibold text-gray-900 flex-1">
                  {tree.labeled_common_name || (
                    <span className="text-gray-400 italic">Not labeled</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="text-xl">🤖</div>
                </div>
                <p className="text-lg font-semibold text-gray-900 flex-1">
                  {tree.predicted_common_name || (
                    <span className="text-gray-400 italic">No prediction</span>
                  )}
                </p>
              </div>
            </div>

            {/* Accuracy Status */}
            {/* {hasLabel && hasPrediction && (
              <div className="pt-3 border-t border-gray-100">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isPredictionCorrect
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  <span>
                    {isPredictionCorrect
                      ? "AI prediction is correct"
                      : "AI prediction needs correction"}
                  </span>
                </div>
              </div>
            )} */}
          </div>

          {/* Species Selection */}
          <div className="space-y-3 pt-6 border-t border-gray-100">
            {/* <label className="block text-sm font-medium text-gray-700">
              Update Species Classification
            </label> */}
            <Select
              value={selectedSpeciesId}
              onValueChange={setSelectedSpeciesId}
            >
              <SelectTrigger className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select species..." />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {speciesOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Update Button */}
          {selectedSpeciesId &&
            parseInt(selectedSpeciesId) !== tree.labeled_specie_id && (
              <Button
                onClick={handleUpdateSpecies}
                disabled={isUpdating}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  "Update Species"
                )}
              </Button>
            )}
        </CardContent>
      </Card>
    );
  }
);

TreeCard.displayName = "TreeCard";
