import React from "react";
import { TreeCard } from "./TreeCard";
import type { Tree, Species } from "../types";

interface TreeGridProps {
  trees: Tree[];
  species: Species[];
  onSpeciesUpdate: (treeId: number, newSpeciesId: number) => void;
}

export const TreeGrid: React.FC<TreeGridProps> = ({
  trees,
  species,
  onSpeciesUpdate,
}) => {
  if (trees.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 text-8xl mb-4">🌳</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No trees found
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          It looks like there are no trees in the database yet. Check your
          backend connection or add some data.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {trees.map((tree) => (
        <TreeCard
          key={tree.tree_id}
          tree={tree}
          species={species}
          onSpeciesUpdate={onSpeciesUpdate}
        />
      ))}
    </div>
  );
};
