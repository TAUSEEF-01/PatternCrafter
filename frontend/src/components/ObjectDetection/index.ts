/**
 * Object Detection Module Exports
 */

export { ObjectDetectionTask } from "./ObjectDetectionTask";
export { ObjectDetectionAnnotator } from "./ObjectDetectionAnnotator";
export { MultiToolAnnotator } from "./MultiToolAnnotator";

export type {
  BoundingBox,
  Polygon,
  Polyline,
  PointAnnotation,
  SegmentationMask,
  AnnotationShape,
  AnnotationType,
  Point,
  ObjectDetectionData,
  ObjectDetectionAnnotation,
  ObjectDetectionState,
  DrawingState,
  ToolState,
} from "./types";

export {
  validateImageUrl,
  validateClasses,
  parseClassesFromString,
  getImageDimensions,
  generateBoxId,
  generateAnnotationId,
  calculateBoxArea,
  boxesOverlap,
  calculateIoU,
  normalizeBoundingBox,
  pixelsToPercentage,
  percentageToPixels,
  getColorForLabel,
  formatConfidenceLabel,
  getConfidenceColor,
  validateObjectDetectionData,
  isPointInBox,
  getResizeHandle,
  distanceBetweenPoints,
  isPointNearLine,
  isPointInPolygon,
  calculatePolygonArea,
  calculatePolygonCentroid,
  simplifyPolygon,
  encodeRLE,
  decodeRLEBounds,
} from "./utils";

export { CONFIDENCE_LEVELS, BOX_COLORS, ANNOTATION_TYPE_META } from "./types";
