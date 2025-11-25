/**
 * Image Classification Types
 * Follows Label Studio's image classification data model
 */

export interface ImageClassificationData {
  image_url: string;
  labels: string[];
  description?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
  };
}

export interface ImageClassificationAnnotation {
  selected_label: string;
  confidence?: number; // 1-5 scale
  notes?: string;
}

export interface ImageClassificationState {
  imageUrl: string;
  labels: string[];
  description: string;
  newLabel: string;
}

export const CONFIDENCE_LEVELS = [
  { value: 1, label: "Very Low", color: "bg-red-500" },
  { value: 2, label: "Low", color: "bg-orange-500" },
  { value: 3, label: "Medium", color: "bg-yellow-500" },
  { value: 4, label: "High", color: "bg-lime-500" },
  { value: 5, label: "Very High", color: "bg-green-500" },
] as const;
