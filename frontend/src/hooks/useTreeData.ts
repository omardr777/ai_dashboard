import { useState, useEffect, useCallback, useMemo } from "react";
import type { Tree, Species } from "../types";
import { api } from "../services/api";

export const useTreeData = () => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize statistics for better performance
  const stats = useMemo(() => {
    const total = trees.length;
    const labeled = trees.filter(
      (tree) => tree.labeled_specie_id !== null
    ).length;
    const predicted = trees.filter(
      (tree) => tree.predicted_specie_id !== null
    ).length;
    const matches = trees.filter(
      (tree) =>
        tree.labeled_specie_id !== null &&
        tree.predicted_specie_id !== null &&
        tree.labeled_specie_id === tree.predicted_specie_id
    ).length;
    const mismatches = trees.filter(
      (tree) =>
        tree.labeled_specie_id !== null &&
        tree.predicted_specie_id !== null &&
        tree.labeled_specie_id !== tree.predicted_specie_id
    ).length;

    return {
      total,
      labeled,
      predicted,
      matches,
      mismatches,
      accuracy: labeled > 0 ? ((matches / labeled) * 100).toFixed(1) : "0",
    };
  }, [trees]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [treesData, speciesData] = await Promise.all([
        api.getTrees(),
        api.getSpecies(),
      ]);

      setTrees(treesData);
      setSpecies(speciesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSpeciesUpdate = useCallback(
    (treeId: number, newSpeciesId: number) => {
      setTrees((prevTrees) =>
        prevTrees.map((tree) => {
          if (tree.tree_id === treeId) {
            const newSpecies = species.find((s) => s.id === newSpeciesId);
            return {
              ...tree,
              labeled_specie_id: newSpeciesId,
              labeled_common_name: newSpecies?.common_name || null,
            };
          }
          return tree;
        })
      );
    },
    [species]
  );

  const refreshTrees = useCallback(async () => {
    try {
      const treesData = await api.getTrees();
      setTrees(treesData);
    } catch (err) {
      console.error("Failed to refresh trees:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    trees,
    species,
    loading,
    error,
    stats,
    handleSpeciesUpdate,
    refreshTrees,
    retryFetch: fetchData,
  };
};
