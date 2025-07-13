export interface Tree {
  tree_id: number;
  image_name: string;
  compressed_image_name: string;
  predicted_specie_id: number | null;
  predicted_common_name: string | null;
  labeled_specie_id: number | null;
  labeled_common_name: string | null;
}

export interface Species {
  id: number;
  common_name: string;
}

export interface UpdateSpeciesRequest {
  predicted_specie_id: number;
  labeled_specie_id: number;
  model_name: string;
  model_version: string;
}
