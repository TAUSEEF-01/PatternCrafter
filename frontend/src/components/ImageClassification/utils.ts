/**
 * Image Classification Utility Functions
 */

export const validateImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a valid URL format
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateLabels = (labels: string[]): boolean => {
  return labels.length >= 2 && labels.every((label) => label.trim().length > 0);
};

export const parseLabelsFromString = (labelsString: string): string[] => {
  return labelsString
    .split(",")
    .map((label) => label.trim())
    .filter((label) => label.length > 0);
};

export const getImageDimensions = (
  url: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const formatConfidenceLabel = (confidence: number): string => {
  const levels = ["Very Low", "Low", "Medium", "High", "Very High"];
  return levels[confidence - 1] || "Unknown";
};

export const getConfidenceColor = (confidence: number): string => {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ];
  return colors[confidence - 1] || "bg-gray-500";
};
