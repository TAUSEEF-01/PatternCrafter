import { useEffect, useRef, useState } from "react";

// Import object detection types
interface Point {
  x: number;
  y: number;
}

interface BoundingBox {
  id: string;
  type: "bbox";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

interface Polygon {
  id: string;
  type: "polygon";
  points: Point[];
  label: string;
  confidence: number;
}

interface Polyline {
  id: string;
  type: "polyline";
  points: Point[];
  label: string;
  confidence: number;
}

interface PointAnnotation {
  id: string;
  type: "point";
  x: number;
  y: number;
  label: string;
  confidence: number;
}

interface SegmentationMask {
  id: string;
  type: "mask";
  rle: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label: string;
  confidence: number;
}

type AnnotationShape =
  | BoundingBox
  | Polygon
  | Polyline
  | PointAnnotation
  | SegmentationMask;

const BOX_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B739",
  "#52B788",
];

const ANNOTATION_TYPE_META = {
  bbox: { label: "Bounding Box", icon: "▭", color: "#4ECDC4" },
  polygon: { label: "Polygon", icon: "⬡", color: "#FF6B6B" },
  polyline: { label: "Polyline", icon: "〰", color: "#FFA07A" },
  point: { label: "Point", icon: "●", color: "#45B7D1" },
  mask: { label: "Segmentation", icon: "🎨", color: "#98D8C8" },
};

interface AnnotationViewerProps {
  task: {
    category: string;
    task_data: any;
    annotation?: any;
  };
}

export default function AnnotationViewer({ task }: AnnotationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    null
  );
  const [canvasRect, setCanvasRect] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract annotations based on category
  const getAnnotations = (): AnnotationShape[] => {
    if (!task.annotation) return [];

    if (task.category === "object_detection") {
      // Handle new format with multiple annotation types
      if (
        task.annotation.annotations &&
        Array.isArray(task.annotation.annotations)
      ) {
        return task.annotation.annotations;
      }
      // Handle legacy bounding_boxes format
      if (
        task.annotation.bounding_boxes &&
        Array.isArray(task.annotation.bounding_boxes)
      ) {
        return task.annotation.bounding_boxes.map((box: any) => ({
          ...box,
          type: "bbox",
        }));
      }
      // Handle very old format with objects array
      if (task.annotation.objects && Array.isArray(task.annotation.objects)) {
        return task.annotation.objects.map((obj: any, idx: number) => ({
          id: `bbox_${idx}`,
          type: "bbox",
          x: obj.bbox[0],
          y: obj.bbox[1],
          width: obj.bbox[2],
          height: obj.bbox[3],
          label: obj.class,
          confidence: obj.confidence || 0.5,
        }));
      }
    }

    return [];
  };

  const annotations = getAnnotations();
  const imageUrl = task.task_data?.image_url || "";

  // Load and draw image
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !imageUrl) return;

    setImageLoaded(false);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    imageRef.current = img;

    // Try without crossOrigin first for better compatibility
    // img.crossOrigin = 'anonymous';

    const drawImage = () => {
      if (!img.complete || !img.naturalWidth) return;

      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      // Calculate canvas size to fit container while maintaining aspect ratio
      const containerWidth = container.clientWidth || 800; // Fallback width
      const maxHeight = 600;
      const aspectRatio = img.naturalWidth / img.naturalHeight;

      let canvasWidth = Math.min(containerWidth - 32, containerWidth); // Account for padding
      let canvasHeight = canvasWidth / aspectRatio;

      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      setCanvasRect({ width: canvasWidth, height: canvasHeight });

      // Clear canvas before drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      setImageLoaded(true);
    };

    img.onload = drawImage;

    img.onerror = (e) => {
      console.error("Failed to load image:", imageUrl, e);
      setImageLoaded(false);
      // Try with crossOrigin if first attempt fails
      if (!img.crossOrigin) {
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
      }
    };

    img.src = imageUrl;

    // Cleanup
    return () => {
      imageRef.current = null;
    };
  }, [imageUrl]);

  // Handle window resize
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const img = imageRef.current;

      if (!canvas || !container || !img || !img.complete) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const containerWidth = container.clientWidth || 800;
      const maxHeight = 600;
      const aspectRatio = img.naturalWidth / img.naturalHeight;

      let canvasWidth = Math.min(containerWidth - 32, containerWidth);
      let canvasHeight = canvasWidth / aspectRatio;

      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      setCanvasRect({ width: canvasWidth, height: canvasHeight });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageLoaded]);

  const percentageToPixels = (
    percentage: number,
    dimension: number
  ): number => {
    return (percentage / 100) * dimension;
  };

  const getColorForLabel = (label: string, index: number): string => {
    const hash = label
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (
      BOX_COLORS[hash % BOX_COLORS.length] ||
      BOX_COLORS[index % BOX_COLORS.length]
    );
  };

  const renderAnnotations = () => {
    if (!canvasRect.width || !canvasRect.height) return null;

    return annotations.map((annotation, index) => {
      const color = getColorForLabel(annotation.label, index);
      const isSelected = selectedAnnotation === annotation.id;
      const strokeWidth = isSelected ? 3 : 2;

      if (annotation.type === "bbox") {
        const x = percentageToPixels(annotation.x, canvasRect.width);
        const y = percentageToPixels(annotation.y, canvasRect.height);
        const width = percentageToPixels(annotation.width, canvasRect.width);
        const height = percentageToPixels(annotation.height, canvasRect.height);

        return (
          <div
            key={annotation.id}
            className="absolute cursor-pointer transition-all"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              border: `${strokeWidth}px solid ${color}`,
              backgroundColor: `${color}15`,
              boxShadow: isSelected
                ? `0 0 0 2px white, 0 0 0 4px ${color}`
                : "none",
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <div
              className="absolute -top-6 left-0 px-2 py-1 text-xs font-bold text-white rounded"
              style={{ backgroundColor: color }}
            >
              {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </div>
          </div>
        );
      } else if (annotation.type === "polygon") {
        const points = annotation.points
          .map(
            (p) =>
              `${percentageToPixels(
                p.x,
                canvasRect.width
              )},${percentageToPixels(p.y, canvasRect.height)}`
          )
          .join(" ");

        const firstPoint = annotation.points[0];
        const labelX = percentageToPixels(firstPoint.x, canvasRect.width);
        const labelY = percentageToPixels(firstPoint.y, canvasRect.height);

        return (
          <svg
            key={annotation.id}
            className="absolute pointer-events-none cursor-pointer"
            style={{
              top: 0,
              left: 0,
              width: `${canvasRect.width}px`,
              height: `${canvasRect.height}px`,
              zIndex: isSelected ? 20 : 10,
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <polygon
              points={points}
              fill={`${color}20`}
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {annotation.points.map((point, idx) => (
              <circle
                key={idx}
                cx={percentageToPixels(point.x, canvasRect.width)}
                cy={percentageToPixels(point.y, canvasRect.height)}
                r={4}
                fill={color}
                stroke="white"
                strokeWidth={1}
              />
            ))}
            <text
              x={labelX}
              y={labelY - 10}
              fill={color}
              fontSize="12"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </text>
          </svg>
        );
      } else if (annotation.type === "polyline") {
        const points = annotation.points
          .map(
            (p) =>
              `${percentageToPixels(
                p.x,
                canvasRect.width
              )},${percentageToPixels(p.y, canvasRect.height)}`
          )
          .join(" ");

        const firstPoint = annotation.points[0];
        const labelX = percentageToPixels(firstPoint.x, canvasRect.width);
        const labelY = percentageToPixels(firstPoint.y, canvasRect.height);

        return (
          <svg
            key={annotation.id}
            className="absolute pointer-events-none cursor-pointer"
            style={{
              top: 0,
              left: 0,
              width: `${canvasRect.width}px`,
              height: `${canvasRect.height}px`,
              zIndex: isSelected ? 20 : 10,
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {annotation.points.map((point, idx) => (
              <circle
                key={idx}
                cx={percentageToPixels(point.x, canvasRect.width)}
                cy={percentageToPixels(point.y, canvasRect.height)}
                r={4}
                fill={color}
                stroke="white"
                strokeWidth={1}
              />
            ))}
            <text
              x={labelX}
              y={labelY - 10}
              fill={color}
              fontSize="12"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </text>
          </svg>
        );
      } else if (annotation.type === "point") {
        const x = percentageToPixels(annotation.x, canvasRect.width);
        const y = percentageToPixels(annotation.y, canvasRect.height);

        return (
          <svg
            key={annotation.id}
            className="absolute pointer-events-none cursor-pointer"
            style={{
              top: 0,
              left: 0,
              width: `${canvasRect.width}px`,
              height: `${canvasRect.height}px`,
              zIndex: isSelected ? 20 : 10,
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <circle
              cx={x}
              cy={y}
              r={6}
              fill={color}
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={x + 10}
              y={y - 10}
              fill={color}
              fontSize="12"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </text>
          </svg>
        );
      } else if (annotation.type === "mask" && annotation.bounds) {
        const x = percentageToPixels(annotation.bounds.x, canvasRect.width);
        const y = percentageToPixels(annotation.bounds.y, canvasRect.height);
        const width = percentageToPixels(
          annotation.bounds.width,
          canvasRect.width
        );
        const height = percentageToPixels(
          annotation.bounds.height,
          canvasRect.height
        );

        return (
          <div
            key={annotation.id}
            className="absolute pointer-events-none cursor-pointer"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: `${color}40`,
              border: `${strokeWidth}px solid ${color}`,
              boxShadow: isSelected
                ? `0 0 0 2px white, 0 0 0 4px ${color}`
                : "none",
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <div
              className="absolute -top-6 left-0 px-2 py-1 text-xs font-bold text-white rounded flex items-center gap-1"
              style={{ backgroundColor: color }}
            >
              🎨 {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </div>
          </div>
        );
      }

      return null;
    });
  };

  const getAnnotationTypeCounts = () => {
    const counts: { [key: string]: number } = {};
    annotations.forEach((ann) => {
      counts[ann.type] = (counts[ann.type] || 0) + 1;
    });
    return counts;
  };

  const typeCounts = getAnnotationTypeCounts();

  if (task.category === "image_classification") {
    // Handle image classification annotations beautifully
    const annotation = task.annotation;
    if (!annotation) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-amber-800 font-medium">No annotation submitted</p>
          <p className="text-sm text-amber-600 mt-1">
            The annotator has not submitted an annotation for this task yet.
          </p>
        </div>
      );
    }

    const selectedLabel = annotation.selected_label || annotation.selectedLabel;
    const confidence = annotation.confidence;
    const rawLabelConfidences =
      annotation.label_confidences || annotation.labelConfidences;
    const notes = annotation.notes;

    type LabelConfidenceEntry = { label: string; confidence: number };

    const clampConfidence = (value: unknown): number => {
      const num = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(num)) return 3;
      return Math.min(5, Math.max(1, Math.round(num)));
    };

    const normalizeLabelConfidences = (
      input: unknown
    ): LabelConfidenceEntry[] => {
      if (!input) return [];
      if (Array.isArray(input)) {
        return input
          .filter(
            (item): item is { label: string; confidence?: unknown } =>
              Boolean(item) && typeof item.label === "string"
          )
          .map((item) => ({
            label: item.label,
            confidence: clampConfidence(item.confidence ?? 3),
          }));
      }
      if (typeof input === "object") {
        return Object.entries(input).map(([label, value]) => ({
          label,
          confidence: clampConfidence(
            typeof value === "object" && value !== null
              ? (value as { confidence?: unknown }).confidence
              : value
          ),
        }));
      }
      return [];
    };

    const dedupeLabelConfidences = (
      entries: LabelConfidenceEntry[]
    ): LabelConfidenceEntry[] => {
      const seen = new Set<string>();
      const result: LabelConfidenceEntry[] = [];
      entries.forEach((entry) => {
        const key = entry.label?.trim().toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        result.push(entry);
      });
      return result;
    };

    const labelConfidences = dedupeLabelConfidences(
      normalizeLabelConfidences(rawLabelConfidences)
    );
    const hasLabelConfidences = labelConfidences.length > 0;

    // Convert 1-5 scale to categorical confidence label
    const getConfidenceLevelDisplay = (conf: number) => {
      const levelMap: Record<
        number,
        { label: string; bg: string; text: string; border: string }
      > = {
        1: {
          label: "Very Low",
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-300",
        },
        2: {
          label: "Low",
          bg: "bg-orange-100",
          text: "text-orange-700",
          border: "border-orange-300",
        },
        3: {
          label: "Medium",
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          border: "border-yellow-300",
        },
        4: {
          label: "High",
          bg: "bg-lime-100",
          text: "text-lime-700",
          border: "border-lime-300",
        },
        5: {
          label: "Very High",
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-300",
        },
      };
      const level = levelMap[conf] || levelMap[3];
      return (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${level.bg} ${level.text} border ${level.border}`}
        >
          {level.label}
        </span>
      );
    };

    // Determine confidence display
    const getConfidenceDisplay = (conf: number | string | undefined) => {
      if (conf === undefined || conf === null) return null;

      // Handle string confidence levels
      if (typeof conf === "string") {
        const levelColors: Record<
          string,
          { bg: string; text: string; border: string }
        > = {
          very_low: {
            bg: "bg-red-100",
            text: "text-red-700",
            border: "border-red-300",
          },
          low: {
            bg: "bg-orange-100",
            text: "text-orange-700",
            border: "border-orange-300",
          },
          medium: {
            bg: "bg-yellow-100",
            text: "text-yellow-700",
            border: "border-yellow-300",
          },
          high: {
            bg: "bg-green-100",
            text: "text-green-700",
            border: "border-green-300",
          },
          very_high: {
            bg: "bg-emerald-100",
            text: "text-emerald-700",
            border: "border-emerald-300",
          },
        };
        const colors = levelColors[conf] || {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-300",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            {conf.replace("_", " ")}
          </span>
        );
      }

      // Handle numeric confidence (0-1 or 1-10 scale)
      const numConf = Number(conf);
      if (isNaN(numConf)) return null;

      // Determine if it's 0-1 scale or 1-10 scale
      const percentage =
        numConf <= 1 ? Math.round(numConf * 100) : Math.round(numConf * 10);

      let colorClass = "text-gray-600";
      let bgClass = "bg-gray-100";
      if (percentage >= 80) {
        colorClass = "text-green-600";
        bgClass = "bg-green-100";
      } else if (percentage >= 60) {
        colorClass = "text-yellow-600";
        bgClass = "bg-yellow-100";
      } else if (percentage >= 40) {
        colorClass = "text-orange-600";
        bgClass = "bg-orange-100";
      } else {
        colorClass = "text-red-600";
        bgClass = "bg-red-100";
      }

      return (
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-full text-sm font-bold ${colorClass} ${bgClass}`}
          >
            {percentage}%
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                percentage >= 80
                  ? "bg-green-500"
                  : percentage >= 60
                  ? "bg-yellow-500"
                  : percentage >= 40
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        {/* Selected Label Section / Summary */}
        {hasLabelConfidences ? (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-lg p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Annotation Summary
              </h4>
              {selectedLabel && (
                <div className="flex items-center gap-2 text-sm text-purple-700 bg-white/60 px-3 py-1 rounded-full border border-purple-200">
                  <span className="font-medium">Selected label:</span>
                  <span className="font-semibold">{selectedLabel}</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-purple-100 bg-white">
              <table className="min-w-full divide-y divide-purple-100 text-sm">
                <thead className="bg-purple-50/70 text-xs uppercase tracking-wide text-purple-900">
                  <tr>
                    <th className="px-4 py-3 text-left">Label</th>
                    <th className="px-4 py-3 text-left">Confidence</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50">
                  {labelConfidences.map((item) => {
                    const isSelected = item.label === selectedLabel;
                    return (
                      <tr
                        key={item.label}
                        className={isSelected ? "bg-purple-50/80" : "bg-white"}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            <span>{item.label}</span>
                            {isSelected && (
                              <span className="text-[10px] uppercase tracking-wide font-bold text-white bg-purple-600 px-2 py-0.5 rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getConfidenceLevelDisplay(item.confidence)}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                          {isSelected ? "Primary" : "Candidate"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-5">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Selected Label
            </h4>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold bg-purple-600 text-white shadow-md">
                {selectedLabel || "No label selected"}
              </span>
            </div>
          </div>
        )}

        {/* Overall Confidence Section - only show if no per-label confidences */}
        {confidence !== undefined &&
          confidence !== null &&
          !hasLabelConfidences && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Confidence Level
              </h4>
              {typeof confidence === "number" &&
              confidence >= 1 &&
              confidence <= 5
                ? getConfidenceLevelDisplay(confidence)
                : getConfidenceDisplay(confidence)}
            </div>
          )}

        {/* Show available labels from task_data when no per-label confidences recorded */}
        {!hasLabelConfidences &&
          task.task_data?.labels &&
          Array.isArray(task.task_data.labels) && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Available Labels
              </h4>
              <p className="text-xs text-gray-500 mb-3 italic">
                (Per-label confidence not recorded for this annotation)
              </p>
              <div className="space-y-2">
                {task.task_data.labels.map((label: string) => {
                  const isSelected = label === selectedLabel;
                  return (
                    <div
                      key={label}
                      className={`p-3 rounded-lg border ${
                        isSelected
                          ? "bg-purple-50 border-purple-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          isSelected ? "text-purple-700" : "text-gray-700"
                        }`}
                      >
                        {label}
                        {isSelected && (
                          <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                            ✓ SELECTED
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Notes Section */}
        {notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              Annotator Notes
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
          </div>
        )}
      </div>
    );
  }

  if (task.category !== "object_detection") {
    // Fallback for other non-object-detection tasks
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium mb-2">Annotation Data</h3>
        <pre className="text-sm overflow-auto max-h-96 bg-white p-3 rounded border">
          {JSON.stringify(task.annotation, null, 2)}
        </pre>
      </div>
    );
  }

  if (annotations.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-amber-800 font-medium">No annotations found</p>
        <p className="text-sm text-amber-600 mt-1">
          The annotator has not submitted any annotations for this task yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Annotation Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-xl">📊</span>
          Annotation Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(typeCounts).map(([type, count]) => {
            const meta =
              ANNOTATION_TYPE_META[type as keyof typeof ANNOTATION_TYPE_META];
            return (
              <div
                key={type}
                className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{meta?.icon}</span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: meta?.color }}
                  >
                    {count}
                  </span>
                </div>
                <div className="text-xs font-medium text-gray-600">
                  {meta?.label}
                </div>
              </div>
            );
          })}
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-white mb-1">
              {annotations.length}
            </div>
            <div className="text-xs font-medium text-white">Total</div>
          </div>
        </div>
      </div>

      {/* Visual Annotation Display */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">🖼️</span>
            Annotated Image
          </h3>
          <div className="text-xs text-gray-300">
            {imageDimensions.width} × {imageDimensions.height}px
          </div>
        </div>
        <div
          ref={containerRef}
          className="bg-gray-100 p-4 min-h-[400px] flex items-center justify-center"
        >
          {!imageLoaded && imageUrl && (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm font-medium">
                  Loading annotated image...
                </p>
                <p className="text-xs text-gray-400 mt-1">Please wait</p>
              </div>
            </div>
          )}
          {/* Wrapper to keep canvas and annotations aligned together */}
          <div
            className="relative"
            style={{
              width: canvasRect.width ? `${canvasRect.width}px` : "auto",
              height: canvasRect.height ? `${canvasRect.height}px` : "auto",
              display: imageLoaded && canvasRect.width ? "block" : "none",
            }}
          >
            <canvas
              ref={canvasRef}
              className="rounded shadow-md absolute top-0 left-0"
              style={{
                width: canvasRect.width ? `${canvasRect.width}px` : "auto",
                height: canvasRect.height ? `${canvasRect.height}px` : "auto",
              }}
            />
            {imageLoaded && renderAnnotations()}
          </div>
        </div>
      </div>

      {/* Annotation Details List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Annotation Details ({annotations.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {annotations.map((annotation, index) => {
            const color = getColorForLabel(annotation.label, index);
            const meta = ANNOTATION_TYPE_META[annotation.type];
            const isSelected = selectedAnnotation === annotation.id;

            return (
              <div
                key={annotation.id}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedAnnotation(annotation.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{meta.icon}</span>
                      <span
                        className="font-semibold text-sm px-2 py-1 rounded"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {annotation.label}
                      </span>
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                        {meta.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Confidence:</span>{" "}
                        <span className="font-semibold text-green-600">
                          {Math.round(annotation.confidence * 100)}%
                        </span>
                      </div>
                      {annotation.type === "bbox" && (
                        <>
                          <div>
                            <span className="font-medium">Position:</span> (
                            {annotation.x.toFixed(1)}%,{" "}
                            {annotation.y.toFixed(1)}%)
                          </div>
                          <div>
                            <span className="font-medium">Size:</span>{" "}
                            {annotation.width.toFixed(1)}% ×{" "}
                            {annotation.height.toFixed(1)}%
                          </div>
                        </>
                      )}
                      {(annotation.type === "polygon" ||
                        annotation.type === "polyline") && (
                        <div>
                          <span className="font-medium">Points:</span>{" "}
                          {annotation.points.length}
                        </div>
                      )}
                      {annotation.type === "point" && (
                        <div>
                          <span className="font-medium">Location:</span> (
                          {annotation.x.toFixed(1)}%, {annotation.y.toFixed(1)}
                          %)
                        </div>
                      )}
                      {annotation.type === "mask" && annotation.bounds && (
                        <>
                          <div>
                            <span className="font-medium">Region:</span>{" "}
                            {annotation.bounds.width.toFixed(1)}% ×{" "}
                            {annotation.bounds.height.toFixed(1)}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="w-8 h-8 rounded border-2 shadow-sm"
                    style={{
                      backgroundColor: `${color}40`,
                      borderColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes Section */}
      {task.annotation?.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-xl">💬</span>
            Annotator Notes
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {task.annotation.notes}
          </p>
        </div>
      )}
    </div>
  );
}
