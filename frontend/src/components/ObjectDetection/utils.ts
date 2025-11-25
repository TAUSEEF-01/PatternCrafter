/**
 * Object Detection Utility Functions
 * Helper functions for multi-type annotations (bbox, polygon, polyline, point, mask)
 */

import { BoundingBox, ObjectDetectionData, BOX_COLORS, Point, AnnotationShape, Polygon, Polyline } from "./types";

/**
 * Validates image URL format
 */
export function validateImageUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return false;

  try {
    const urlObj = new URL(url);
    const validProtocols = ["http:", "https:", "data:"];
    if (!validProtocols.includes(urlObj.protocol)) return false;

    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const pathname = urlObj.pathname.toLowerCase();
    return (
      validExtensions.some((ext) => pathname.endsWith(ext)) ||
      urlObj.protocol === "data:"
    );
  } catch {
    return false;
  }
}

/**
 * Validates object classes/labels
 */
export function validateClasses(classes: string[]): boolean {
  return classes.length >= 1 && classes.every((c) => c.trim().length > 0);
}

/**
 * Parse classes from comma-separated string
 */
export function parseClassesFromString(input: string): string[] {
  return input
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

/**
 * Get image dimensions asynchronously
 */
export async function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Generate unique ID for bounding box
 */
export function generateBoxId(): string {
  return `box_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate bounding box area
 */
export function calculateBoxArea(box: BoundingBox): number {
  return box.width * box.height;
}

/**
 * Check if two bounding boxes overlap
 */
export function boxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  const x1Min = box1.x;
  const x1Max = box1.x + box1.width;
  const y1Min = box1.y;
  const y1Max = box1.y + box1.height;

  const x2Min = box2.x;
  const x2Max = box2.x + box2.width;
  const y2Min = box2.y;
  const y2Max = box2.y + box2.height;

  return !(x1Max < x2Min || x2Max < x1Min || y1Max < y2Min || y2Max < y1Min);
}

/**
 * Calculate Intersection over Union (IoU) for two boxes
 */
export function calculateIoU(box1: BoundingBox, box2: BoundingBox): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (x2 < x1 || y2 < y1) return 0;

  const intersection = (x2 - x1) * (y2 - y1);
  const area1 = box1.width * box1.height;
  const area2 = box2.width * box2.height;
  const union = area1 + area2 - intersection;

  return intersection / union;
}

/**
 * Normalize bounding box coordinates (ensure positive width/height)
 */
export function normalizeBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number } {
  const normalizedX = width < 0 ? x + width : x;
  const normalizedY = height < 0 ? y + height : y;
  const normalizedWidth = Math.abs(width);
  const normalizedHeight = Math.abs(height);

  return {
    x: Math.max(0, Math.min(100, normalizedX)),
    y: Math.max(0, Math.min(100, normalizedY)),
    width: Math.min(100 - normalizedX, normalizedWidth),
    height: Math.min(100 - normalizedY, normalizedHeight),
  };
}

/**
 * Convert pixel coordinates to percentage
 */
export function pixelsToPercentage(
  pixels: number,
  containerSize: number
): number {
  return (pixels / containerSize) * 100;
}

/**
 * Convert percentage to pixel coordinates
 */
export function percentageToPixels(
  percentage: number,
  containerSize: number
): number {
  return (percentage / 100) * containerSize;
}

/**
 * Get color for a label (consistent hashing)
 */
export function getColorForLabel(label: string, allLabels: string[]): string {
  const index = allLabels.indexOf(label);
  if (index === -1) return BOX_COLORS[0];
  return BOX_COLORS[index % BOX_COLORS.length];
}

/**
 * Format confidence level label
 */
export function formatConfidenceLabel(confidence?: number): string {
  if (!confidence) return "Not set";
  const labels = ["Very Low", "Low", "Medium", "High", "Very High"];
  return labels[confidence - 1] || "Unknown";
}

/**
 * Get confidence color class
 */
export function getConfidenceColor(confidence?: number): string {
  if (!confidence) return "bg-gray-400";
  const colors = [
    "bg-red-600",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-600",
  ];
  return colors[confidence - 1] || "bg-gray-400";
}

/**
 * Validate complete object detection data
 */
export function validateObjectDetectionData(
  data: ObjectDetectionData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateImageUrl(data.image_url)) {
    errors.push("Valid image URL is required");
  }

  if (!validateClasses(data.classes)) {
    errors.push("At least one valid object class is required");
  }

  if (data.classes.length < 1) {
    errors.push("Minimum 1 object class required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if point is inside bounding box
 */
export function isPointInBox(
  pointX: number,
  pointY: number,
  box: BoundingBox
): boolean {
  return (
    pointX >= box.x &&
    pointX <= box.x + box.width &&
    pointY >= box.y &&
    pointY <= box.y + box.height
  );
}

/**
 * Get resize handle position
 */
export function getResizeHandle(
  mouseX: number,
  mouseY: number,
  box: BoundingBox,
  handleSize: number = 3
): "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null {
  const corners = {
    nw: { x: box.x, y: box.y },
    ne: { x: box.x + box.width, y: box.y },
    sw: { x: box.x, y: box.y + box.height },
    se: { x: box.x + box.width, y: box.y + box.height },
  };

  const edges = {
    n: { x: box.x + box.width / 2, y: box.y },
    s: { x: box.x + box.width / 2, y: box.y + box.height },
    e: { x: box.x + box.width, y: box.y + box.height / 2 },
    w: { x: box.x, y: box.y + box.height / 2 },
  };

  // Check corners first
  for (const [handle, pos] of Object.entries(corners)) {
    if (
      Math.abs(mouseX - pos.x) <= handleSize &&
      Math.abs(mouseY - pos.y) <= handleSize
    ) {
      return handle as "nw" | "ne" | "sw" | "se";
    }
  }

  // Check edges
  for (const [handle, pos] of Object.entries(edges)) {
    if (
      Math.abs(mouseX - pos.x) <= handleSize &&
      Math.abs(mouseY - pos.y) <= handleSize
    ) {
      return handle as "n" | "s" | "e" | "w";
    }
  }

  return null;
}

/**
 * Polygon/Polyline Utilities
 */

// Calculate distance between two points
export function distanceBetweenPoints(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Check if a point is near a line segment
export function isPointNearLine(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
  threshold: number = 5
): boolean {
  const lineLength = distanceBetweenPoints(lineStart, lineEnd);
  if (lineLength === 0) return distanceBetweenPoints(point, lineStart) <= threshold;

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
        (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
        (lineLength * lineLength)
    )
  );

  const projectedPoint = {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  };

  return distanceBetweenPoints(point, projectedPoint) <= threshold;
}

// Check if point is inside polygon
export function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Calculate polygon area
export function calculatePolygonArea(points: { x: number; y: number }[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

// Calculate polygon centroid
export function calculatePolygonCentroid(points: { x: number; y: number }[]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  return { x: x / points.length, y: y / points.length };
}

// Simplify polygon (Douglas-Peucker algorithm)
export function simplifyPolygon(points: { x: number; y: number }[], tolerance: number = 1): { x: number; y: number }[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPolygon(points.slice(0, index + 1), tolerance);
    const right = simplifyPolygon(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}

function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return distanceBetweenPoints(point, lineStart);

  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  const ix = lineStart.x + u * dx;
  const iy = lineStart.y + u * dy;

  return distanceBetweenPoints(point, { x: ix, y: iy });
}

/**
 * Segmentation Mask Utilities
 */

// Encode mask to RLE (Run-Length Encoding)
export function encodeRLE(pixels: number[][]): string {
  const flat = pixels.flat();
  const rle: number[] = [];
  let current = flat[0];
  let count = 1;

  for (let i = 1; i < flat.length; i++) {
    if (flat[i] === current) {
      count++;
    } else {
      rle.push(count);
      current = flat[i];
      count = 1;
    }
  }
  rle.push(count);

  return rle.join(',');
}

// Decode RLE to mask bounds
export function decodeRLEBounds(rle: string, width: number, height: number): { x: number; y: number; width: number; height: number } {
  // Simplified: return full image bounds
  // In production, you'd decode the RLE and find actual bounds
  return { x: 0, y: 0, width: 100, height: 100 };
}

/**
 * ID Generation
 */
export function generateAnnotationId(type: string): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
