/**
 * Multi-Tool Object Detection Annotator
 * Supports: Bounding Boxes, Polygons, Polylines, Points, Segmentation Masks
 * Following Label Studio's comprehensive annotation interface
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ObjectDetectionAnnotation,
  AnnotationShape,
  AnnotationType,
  Point,
  BoundingBox,
  Polygon,
  Polyline,
  PointAnnotation,
  SegmentationMask,
  DrawingState,
  CONFIDENCE_LEVELS,
  ANNOTATION_TYPE_META,
} from "./types";
import {
  generateAnnotationId,
  pixelsToPercentage,
  percentageToPixels,
  getColorForLabel,
  formatConfidenceLabel,
  getConfidenceColor,
  isPointInPolygon,
  isPointNearLine,
  distanceBetweenPoints,
  calculatePolygonCentroid,
  simplifyPolygon,
} from "./utils";

interface MultiToolAnnotatorProps {
  imageUrl: string;
  classes: string[];
  existingAnnotation?: ObjectDetectionAnnotation;
  onAnnotationChange: (annotation: ObjectDetectionAnnotation) => void;
  allowedTypes?: AnnotationType[];
  defaultTool?: AnnotationType;
}

export function MultiToolAnnotator({
  imageUrl,
  classes,
  existingAnnotation,
  onAnnotationChange,
  allowedTypes = ['bbox', 'polygon', 'polyline', 'point', 'mask'],
  defaultTool = 'bbox',
}: MultiToolAnnotatorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<AnnotationShape[]>(
    existingAnnotation?.annotations || existingAnnotation?.bounding_boxes || []
  );
  const [activeTool, setActiveTool] = useState<AnnotationType>(defaultTool);
  const [selectedLabel, setSelectedLabel] = useState<string>(classes[0] || "");
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    points: [],
  });

  const [notes, setNotes] = useState(existingAnnotation?.notes || "");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Mask painting state
  const [brushSize, setBrushSize] = useState(20);
  const [currentMaskPixels, setCurrentMaskPixels] = useState<Set<string>>(new Set());
  const [isPainting, setIsPainting] = useState(false);
  const MAX_CANVAS_HEIGHT = 600;

  const updateCanvasSize = useCallback((dimensions?: { width: number; height: number }) => {
    const dims = dimensions || imageDimensions;
    if (!canvasContainerRef.current || !dims.width || !dims.height) return;

    const availableWidth = canvasContainerRef.current.clientWidth;
    if (!availableWidth) return;

    const aspectRatio = dims.width / dims.height;
    let targetWidth = availableWidth;
    let targetHeight = targetWidth / aspectRatio;

    if (targetHeight > MAX_CANVAS_HEIGHT) {
      targetHeight = MAX_CANVAS_HEIGHT;
      targetWidth = targetHeight * aspectRatio;
    }

    setCanvasSize({ width: targetWidth, height: targetHeight });
  }, [imageDimensions.width, imageDimensions.height]);

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };
      setImageDimensions(dimensions);
      setImageLoaded(true);
      setImageError(false);
      updateCanvasSize(dimensions);
    };
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };
    img.src = imageUrl;
  }, [imageUrl, updateCanvasSize]);

  useEffect(() => {
    if (!imageLoaded) return;

    const handleResize = () => updateCanvasSize();
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded, updateCanvasSize]);

  useEffect(() => {
    if (!maskCanvasRef.current || !canvasSize.width || !canvasSize.height) return;
    maskCanvasRef.current.width = canvasSize.width;
    maskCanvasRef.current.height = canvasSize.height;
  }, [canvasSize]);

  // Update parent component when annotations change
  useEffect(() => {
    const annotation: ObjectDetectionAnnotation = {
      annotations,
      image_url: imageUrl,
      notes: notes || undefined,
      // Legacy support
      bounding_boxes: annotations.filter((a) => a.type === 'bbox') as BoundingBox[],
    };
    onAnnotationChange(annotation);
  }, [annotations, notes, imageUrl, onAnnotationChange]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !selectedLabel || !canvasSize.width || !canvasSize.height) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = pixelsToPercentage(e.clientX - rect.left, rect.width);
    const y = pixelsToPercentage(e.clientY - rect.top, rect.height);

    // Mask painting mode
    if (activeTool === 'mask') {
      setIsPainting(true);
      paintMask(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
      return;
    }

    // Check if clicking on existing annotation
    const clickedAnnotation = findAnnotationAtPoint(x, y);
    if (clickedAnnotation && activeTool === 'bbox') {
      setSelectedAnnotationId(clickedAnnotation.id);
      return;
    }

    // Start drawing new annotation
    if (activeTool === 'point') {
      // Create point immediately
      const newPoint: PointAnnotation = {
        id: generateAnnotationId('point'),
        type: 'point',
        x,
        y,
        label: selectedLabel,
        confidence: 3,
      };
      setAnnotations((prev) => [...prev, newPoint]);
    } else if (activeTool === 'bbox') {
      setDrawingState({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
    } else if (activeTool === 'polygon' || activeTool === 'polyline') {
      // Add point to polygon/polyline
      const existingPoints = drawingState.points || [];
      
      // Check if close to first point (close polygon)
      if (activeTool === 'polygon' && existingPoints.length >= 3) {
        const firstPoint = existingPoints[0];
        const distance = distanceBetweenPoints({ x, y }, firstPoint);
        
        if (distance < 3) {
          // Complete polygon
          const newPolygon: Polygon = {
            id: generateAnnotationId('polygon'),
            type: 'polygon',
            points: simplifyPolygon(existingPoints, 0.5),
            label: selectedLabel,
            confidence: 3,
          };
          setAnnotations((prev) => [...prev, newPolygon]);
          setDrawingState({
            isDrawing: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            points: [],
          });
          return;
        }
      }
      
      setDrawingState((prev) => ({
        ...prev,
        isDrawing: true,
        points: [...existingPoints, { x, y }],
        currentX: x,
        currentY: y,
      }));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !canvasSize.width || !canvasSize.height) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = pixelsToPercentage(e.clientX - rect.left, rect.width);
    const y = pixelsToPercentage(e.clientY - rect.top, rect.height);

    // Mask painting
    if (activeTool === 'mask' && isPainting) {
      paintMask(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
      return;
    }

    if (drawingState.isDrawing) {
      setDrawingState((prev) => ({ ...prev, currentX: x, currentY: y }));
    }

    // Highlight annotation under cursor
    const hoveredAnnotation = findAnnotationAtPoint(x, y);
    setHoveredAnnotationId(hoveredAnnotation?.id || null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // Finish mask painting
    if (activeTool === 'mask' && isPainting) {
      setIsPainting(false);
      finalizeMask();
      return;
    }

    if (!canvasRef.current || !drawingState.isDrawing) return;

    if (activeTool === 'bbox') {
      const width = Math.abs(drawingState.currentX - drawingState.startX);
      const height = Math.abs(drawingState.currentY - drawingState.startY);

      if (width > 1 && height > 1) {
        const newBox: BoundingBox = {
          id: generateAnnotationId('bbox'),
          type: 'bbox',
          x: Math.min(drawingState.startX, drawingState.currentX),
          y: Math.min(drawingState.startY, drawingState.currentY),
          width,
          height,
          label: selectedLabel,
          confidence: 3,
        };
        setAnnotations((prev) => [...prev, newBox]);
      }

      setDrawingState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Complete polyline on Enter
    if (e.key === 'Enter' && activeTool === 'polyline' && drawingState.points && drawingState.points.length >= 2) {
      const newPolyline: Polyline = {
        id: generateAnnotationId('polyline'),
        type: 'polyline',
        points: simplifyPolygon(drawingState.points, 0.5),
        label: selectedLabel,
        confidence: 3,
      };
      setAnnotations((prev) => [...prev, newPolyline]);
      setDrawingState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        points: [],
      });
    }
    
    // Cancel drawing on Escape
    if (e.key === 'Escape') {
      setDrawingState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        points: [],
      });
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, drawingState, selectedLabel]);

  // Mask painting functions
  const paintMask = (pixelX: number, pixelY: number, canvasWidth: number, canvasHeight: number) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const color = getColorForLabel(selectedLabel, classes);
    ctx.fillStyle = color + '80'; // 50% opacity
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Store painted pixels
    const centerX = Math.round(pixelX);
    const centerY = Math.round(pixelY);
    const radius = Math.round(brushSize / 2);

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const px = centerX + dx;
          const py = centerY + dy;
          if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
            setCurrentMaskPixels((prev) => new Set(prev).add(`${px},${py}`));
          }
        }
      }
    }
  };

  const finalizeMask = () => {
    if (currentMaskPixels.size === 0) return;

    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    // Calculate bounding box of the mask
    const points = Array.from(currentMaskPixels).map((key) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });

    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Create mask annotation
    const newMask: SegmentationMask = {
      id: generateAnnotationId('mask'),
      type: 'mask',
      label: selectedLabel,
      confidence: 3,
      bounds: {
        x: pixelsToPercentage(minX, rect.width),
        y: pixelsToPercentage(minY, rect.height),
        width: pixelsToPercentage(maxX - minX, rect.width),
        height: pixelsToPercentage(maxY - minY, rect.height),
      },
      rle: Array.from(currentMaskPixels).join(';'), // Simple storage format
    };

    setAnnotations((prev) => [...prev, newMask]);
    setCurrentMaskPixels(new Set());

    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const findAnnotationAtPoint = (x: number, y: number): AnnotationShape | null => {
    for (const annotation of [...annotations].reverse()) {
      if (annotation.type === 'bbox') {
        if (
          x >= annotation.x &&
          x <= annotation.x + annotation.width &&
          y >= annotation.y &&
          y <= annotation.y + annotation.height
        ) {
          return annotation;
        }
      } else if (annotation.type === 'polygon') {
        if (isPointInPolygon({ x, y }, annotation.points)) {
          return annotation;
        }
      } else if (annotation.type === 'polyline') {
        for (let i = 0; i < annotation.points.length - 1; i++) {
          if (isPointNearLine({ x, y }, annotation.points[i], annotation.points[i + 1], 3)) {
            return annotation;
          }
        }
      } else if (annotation.type === 'point') {
        const distance = distanceBetweenPoints({ x, y }, { x: annotation.x, y: annotation.y });
        if (distance < 3) {
          return annotation;
        }
      }
    }
    return null;
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  };

  const handleUpdateLabel = (id: string, label: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, label } : a))
    );
  };

  const handleUpdateConfidence = (id: string, confidence: number) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, confidence } : a))
    );
  };

  const renderAnnotation = (annotation: AnnotationShape, canvasRect: DOMRect) => {
    const color = getColorForLabel(annotation.label, classes);
    const isSelected = selectedAnnotationId === annotation.id;
    const isHovered = hoveredAnnotationId === annotation.id;
    const strokeWidth = isSelected ? 3 : isHovered ? 2 : 1.5;

    if (annotation.type === 'bbox') {
      const x = percentageToPixels(annotation.x, canvasRect.width);
      const y = percentageToPixels(annotation.y, canvasRect.height);
      const width = percentageToPixels(annotation.width, canvasRect.width);
      const height = percentageToPixels(annotation.height, canvasRect.height);

      return (
        <div
          key={annotation.id}
          className="absolute pointer-events-none"
          style={{
            left: x,
            top: y,
            width,
            height,
            border: `${strokeWidth}px solid ${color}`,
            backgroundColor: `${color}20`,
            boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
          }}
        >
          <div
            className="absolute -top-6 left-0 px-2 py-1 text-xs font-bold text-white rounded"
            style={{ backgroundColor: color }}
          >
            {annotation.label}
          </div>
        </div>
      );
    } else if (annotation.type === 'polygon') {
      const points = annotation.points
        .map((p) => `${percentageToPixels(p.x, canvasRect.width)},${percentageToPixels(p.y, canvasRect.height)}`)
        .join(' ');

      return (
        <svg
          key={annotation.id}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: isSelected ? 20 : 10 }}
        >
          <polygon
            points={points}
            fill={`${color}20`}
            stroke={color}
            strokeWidth={strokeWidth}
          />
          {annotation.points.map((p, idx) => (
            <circle
              key={idx}
              cx={percentageToPixels(p.x, canvasRect.width)}
              cy={percentageToPixels(p.y, canvasRect.height)}
              r={4}
              fill={color}
            />
          ))}
        </svg>
      );
    } else if (annotation.type === 'polyline') {
      const points = annotation.points
        .map((p) => `${percentageToPixels(p.x, canvasRect.width)},${percentageToPixels(p.y, canvasRect.height)}`)
        .join(' ');

      return (
        <svg
          key={annotation.id}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: isSelected ? 20 : 10 }}
        >
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          {annotation.points.map((p, idx) => (
            <circle
              key={idx}
              cx={percentageToPixels(p.x, canvasRect.width)}
              cy={percentageToPixels(p.y, canvasRect.height)}
              r={4}
              fill={color}
            />
          ))}
        </svg>
      );
    } else if (annotation.type === 'point') {
      const x = percentageToPixels(annotation.x, canvasRect.width);
      const y = percentageToPixels(annotation.y, canvasRect.height);

      return (
        <svg
          key={annotation.id}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: isSelected ? 20 : 10 }}
        >
          <circle cx={x} cy={y} r={6} fill={color} stroke="white" strokeWidth={2} />
          <text
            x={x + 10}
            y={y - 10}
            fill={color}
            fontSize="12"
            fontWeight="bold"
            className="pointer-events-none"
          >
            {annotation.label}
          </text>
        </svg>
      );
    } else if (annotation.type === 'mask' && annotation.bounds) {
      const x = percentageToPixels(annotation.bounds.x, canvasRect.width);
      const y = percentageToPixels(annotation.bounds.y, canvasRect.height);
      const width = percentageToPixels(annotation.bounds.width, canvasRect.width);
      const height = percentageToPixels(annotation.bounds.height, canvasRect.height);

      // Render mask as semi-transparent filled region with border
      return (
        <div
          key={annotation.id}
          className="absolute pointer-events-none"
          style={{
            left: x,
            top: y,
            width,
            height,
            backgroundColor: `${color}40`,
            border: `${strokeWidth}px solid ${color}`,
            boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
          }}
        >
          <div
            className="absolute -top-6 left-0 px-2 py-1 text-xs font-bold text-white rounded flex items-center gap-1"
            style={{ backgroundColor: color }}
          >
            🎨 {annotation.label}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderCurrentDrawing = (canvasRect: DOMRect) => {
    const color = getColorForLabel(selectedLabel, classes);

    if (activeTool === 'bbox' && drawingState.isDrawing) {
      const x = Math.min(drawingState.startX, drawingState.currentX);
      const y = Math.min(drawingState.startY, drawingState.currentY);
      const width = Math.abs(drawingState.currentX - drawingState.startX);
      const height = Math.abs(drawingState.currentY - drawingState.startY);

      return (
        <div
          className="absolute pointer-events-none"
          style={{
            left: percentageToPixels(x, canvasRect.width),
            top: percentageToPixels(y, canvasRect.height),
            width: percentageToPixels(width, canvasRect.width),
            height: percentageToPixels(height, canvasRect.height),
            border: `2px dashed ${color}`,
            backgroundColor: `${color}10`,
          }}
        />
      );
    } else if ((activeTool === 'polygon' || activeTool === 'polyline') && drawingState.points && drawingState.points.length > 0) {
      const points = [...drawingState.points, { x: drawingState.currentX, y: drawingState.currentY }];
      const pointsStr = points
        .map((p) => `${percentageToPixels(p.x, canvasRect.width)},${percentageToPixels(p.y, canvasRect.height)}`)
        .join(' ');

      return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 30 }}>
          <polyline
            points={pointsStr}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="5,5"
          />
          {drawingState.points.map((p, idx) => (
            <circle
              key={idx}
              cx={percentageToPixels(p.x, canvasRect.width)}
              cy={percentageToPixels(p.y, canvasRect.height)}
              r={4}
              fill={color}
            />
          ))}
        </svg>
      );
    }

    return null;
  };

  const currentCanvasRect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : null;

  return (
    <div className="space-y-6">
      {/* Tool Selection */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Annotation Tools
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Select the annotation type to use
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-5 gap-3">
            {allowedTypes.map((type) => {
              const meta = ANNOTATION_TYPE_META[type];
              const isActive = activeTool === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setActiveTool(type);
                    setDrawingState({
                      isDrawing: false,
                      startX: 0,
                      startY: 0,
                      currentX: 0,
                      currentY: 0,
                      points: [],
                    });
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                      : 'border-gray-300 bg-white hover:border-blue-400'
                  }`}
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <span className="text-xs font-semibold">{meta.name}</span>
                  <span className="text-xs text-gray-500 font-mono">({meta.shortcut})</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-semibold">
              {ANNOTATION_TYPE_META[activeTool].name}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {ANNOTATION_TYPE_META[activeTool].description}
            </p>
            {activeTool === 'polygon' && (
              <p className="text-xs text-blue-600 mt-2">
                💡 Click to add points. Click near first point to close polygon.
              </p>
            )}
            {activeTool === 'polyline' && (
              <p className="text-xs text-blue-600 mt-2">
                💡 Click to add points. Press <kbd className="px-1 bg-white border rounded">Enter</kbd> to finish.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Class Selection */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Select Object Class
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Choose the label for your annotations
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {classes.map((cls) => (
              <button
                type="button"
                key={cls}
                onClick={() => setSelectedLabel(cls)}
                className={`relative px-4 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  selectedLabel === cls
                    ? "ring-2 ring-blue-500 ring-offset-2"
                    : "hover:border-gray-400"
                }`}
                style={{
                  backgroundColor:
                    selectedLabel === cls
                      ? getColorForLabel(cls, classes)
                      : `${getColorForLabel(cls, classes)}20`,
                  borderColor: getColorForLabel(cls, classes),
                  color: selectedLabel === cls ? "white" : "#1F2937",
                }}
              >
                {selectedLabel === cls && (
                  <svg
                    className="absolute top-1 right-1 w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getColorForLabel(cls, classes) }}
                  ></div>
                  {cls}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Image Canvas
            </h4>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-600">
                {annotations.length} annotation{annotations.length === 1 ? '' : 's'}
              </span>
              {imageDimensions.width > 0 && (
                <span className="text-gray-500 font-mono">
                  {imageDimensions.width} × {imageDimensions.height}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div ref={canvasContainerRef} className="w-full flex justify-center">
            {imageError && (
              <div className="flex items-center justify-center h-96 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-red-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-base text-red-700 font-semibold">
                    Failed to load image
                  </p>
                </div>
              </div>
            )}

            {!imageError && (
              <div
                ref={canvasRef}
                className="relative bg-gray-100 border-2 border-gray-200 rounded-lg overflow-hidden"
                style={{
                  cursor: 'crosshair',
                  width: canvasSize.width ? `${canvasSize.width}px` : '100%',
                  height: canvasSize.height ? `${canvasSize.height}px` : 'auto',
                  minHeight: canvasSize.height ? `${canvasSize.height}px` : '300px',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <img
                  src={imageUrl}
                  alt="Annotation canvas"
                  className="object-contain"
                  style={{
                    display: imageLoaded ? 'block' : 'none',
                    width: canvasSize.width ? `${canvasSize.width}px` : '100%',
                    height: canvasSize.height ? `${canvasSize.height}px` : 'auto',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />

                {!imageLoaded && (
                  <div className="flex items-center justify-center min-h-[400px] bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading image...</p>
                    </div>
                  </div>
                )}

                {imageLoaded && currentCanvasRect && canvasSize.width > 0 && (
                  <>
                    {/* Mask painting canvas */}
                    <canvas
                      ref={maskCanvasRef}
                      className="absolute top-0 left-0 pointer-events-none"
                      width={canvasSize.width}
                      height={canvasSize.height}
                      style={{ zIndex: 25 }}
                    />
                    
                    {annotations.map((annotation) =>
                      renderAnnotation(annotation, currentCanvasRect)
                    )}
                    {renderCurrentDrawing(currentCanvasRect)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brush Size Control for Mask Tool */}
      {activeTool === 'mask' && (
        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Brush Settings
            </h4>
          </div>
          <div className="p-5">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Brush Size: {brushSize}px
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5px</span>
              <span>100px</span>
            </div>
            
            {currentMaskPixels.size > 0 && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={finalizeMask}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  ✓ Save Mask
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMaskPixels(new Set());
                    const canvas = maskCanvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Annotations ({annotations.length})
            </h4>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete all annotations?")) {
                  setAnnotations([]);
                  setSelectedAnnotationId(null);
                }
              }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
            {annotations.map((annotation, idx) => {
              const color = getColorForLabel(annotation.label, classes);
              const meta = ANNOTATION_TYPE_META[annotation.type];

              return (
                <div
                  key={annotation.id}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedAnnotationId === annotation.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onMouseEnter={() => setHoveredAnnotationId(annotation.id)}
                  onMouseLeave={() => setHoveredAnnotationId(null)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: color }}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <select
                          value={annotation.label}
                          onChange={(e) =>
                            handleUpdateLabel(annotation.id, e.target.value)
                          }
                          className="text-sm font-semibold px-2 py-1 border-2 rounded"
                          style={{ borderColor: color }}
                        >
                          {classes.map((cls) => (
                            <option key={cls} value={cls}>
                              {cls}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {meta.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">
                      Confidence Level
                    </label>
                    <div className="flex gap-2">
                      {CONFIDENCE_LEVELS.map((level) => (
                        <button
                          type="button"
                          key={level.value}
                          onClick={() =>
                            handleUpdateConfidence(annotation.id, level.value)
                          }
                          className={`flex-1 px-3 py-2 rounded text-xs font-bold transition-all ${
                            annotation.confidence === level.value
                              ? `${level.color} text-white ring-2 ring-offset-2 ring-blue-500`
                              : `bg-gray-200 text-gray-700 hover:bg-gray-300`
                          }`}
                        >
                          {level.value}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      {formatConfidenceLabel(annotation.confidence || 3)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Additional Notes
            <span className="text-xs text-gray-500 font-normal normal-case tracking-normal ml-2">
              (Optional)
            </span>
          </h4>
        </div>

        <div className="p-5">
          <textarea
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes, observations, or comments..."
          />
        </div>
      </div>

      {/* Summary */}
      {annotations.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5">
          <div className="flex items-start gap-4">
            <svg
              className="w-7 h-7 text-green-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-900 mb-2">
                Annotation Summary
              </p>
              <div className="space-y-1 text-sm text-green-800">
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(
                    annotations.reduce((acc, a) => {
                      acc[a.type] = (acc[a.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <span
                      key={type}
                      className="px-2 py-1 bg-green-200 border border-green-400 rounded font-bold"
                    >
                      {ANNOTATION_TYPE_META[type as AnnotationType].icon} {count} {ANNOTATION_TYPE_META[type as AnnotationType].name}
                      {count > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
