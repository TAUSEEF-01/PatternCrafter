/**
 * Object Detection Types
 * Following Label Studio's multi-type annotation pattern
 * Supports: Bounding Boxes, Polygons, Polylines, Points, Segmentation Masks
 */

// Annotation Types
export type AnnotationType = 'bbox' | 'polygon' | 'polyline' | 'point' | 'mask';

// Point coordinates (percentage-based)
export interface Point {
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
}

// Bounding Box
export interface BoundingBox {
  id: string;
  type: 'bbox';
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  width: number; // percentage width (0-100)
  height: number; // percentage height (0-100)
  label: string;
  confidence?: number; // 1-5 scale for annotation confidence
}

// Polygon (closed shape)
export interface Polygon {
  id: string;
  type: 'polygon';
  points: Point[]; // Array of points forming closed polygon
  label: string;
  confidence?: number;
}

// Polyline (open line)
export interface Polyline {
  id: string;
  type: 'polyline';
  points: Point[]; // Array of points forming line
  label: string;
  confidence?: number;
}

// Single Point
export interface PointAnnotation {
  id: string;
  type: 'point';
  x: number; // percentage from left (0-100)
  y: number; // percentage from top (0-100)
  label: string;
  confidence?: number;
}

// Segmentation Mask (RLE or pixel array)
export interface SegmentationMask {
  id: string;
  type: 'mask';
  rle?: string; // Run-length encoded mask
  pixels?: number[][]; // 2D array of pixel values (for small masks)
  label: string;
  confidence?: number;
  bounds?: { // Bounding box for the mask region
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Union type for all annotation shapes
export type AnnotationShape = BoundingBox | Polygon | Polyline | PointAnnotation | SegmentationMask;

export interface ObjectDetectionData {
  image_url: string;
  classes: string[]; // Available object classes/labels
  description?: string;
  image_width?: number;
  image_height?: number;
  allow_multiple_boxes?: boolean; // Allow multiple annotations per class
  min_box_size?: number; // Minimum box size in pixels
  annotation_types?: AnnotationType[]; // Allowed annotation types (default: all)
  default_annotation_type?: AnnotationType; // Default tool to use
}

export interface ObjectDetectionAnnotation {
  annotations: AnnotationShape[]; // All annotation shapes
  image_url: string;
  notes?: string;
  annotation_time?: number; // Time spent in seconds
  // Legacy support
  bounding_boxes?: BoundingBox[]; // For backward compatibility
}

export interface ObjectDetectionState {
  data: ObjectDetectionData | null;
  annotation: ObjectDetectionAnnotation | null;
  isDrawing: boolean;
  currentBox: Partial<BoundingBox> | null;
  selectedBoxId: string | null;
  currentLabel: string | null;
  imageLoaded: boolean;
  imageError: boolean;
}

export const CONFIDENCE_LEVELS = [
  { value: 1, label: "Very Low", color: "bg-red-600" },
  { value: 2, label: "Low", color: "bg-orange-500" },
  { value: 3, label: "Medium", color: "bg-yellow-500" },
  { value: 4, label: "High", color: "bg-lime-500" },
  { value: 5, label: "Very High", color: "bg-green-600" },
] as const;

export const BOX_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#06B6D4", // cyan
  "#6366F1", // indigo
] as const;

export interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points?: Point[]; // For polygon/polyline drawing
  currentShape?: Partial<AnnotationShape>; // Shape being drawn
}

// Tool modes
export interface ToolState {
  activeTool: AnnotationType;
  selectedLabel: string;
  selectedAnnotationId: string | null;
  isDrawingMode: boolean;
}

// Annotation type metadata
export const ANNOTATION_TYPE_META = {
  bbox: {
    name: 'Bounding Box',
    icon: '⬜',
    description: 'Draw rectangular boxes around objects',
    shortcut: 'B',
  },
  polygon: {
    name: 'Polygon',
    icon: '⬟',
    description: 'Draw closed polygonal shapes',
    shortcut: 'P',
  },
  polyline: {
    name: 'Polyline',
    icon: '〰️',
    description: 'Draw open lines',
    shortcut: 'L',
  },
  point: {
    name: 'Point',
    icon: '📍',
    description: 'Mark single points',
    shortcut: 'O',
  },
  mask: {
    name: 'Segmentation',
    icon: '🎨',
    description: 'Paint segmentation masks',
    shortcut: 'M',
  },
} as const;
