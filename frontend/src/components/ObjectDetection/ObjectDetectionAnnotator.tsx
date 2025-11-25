/**
 * Object Detection Annotator Component
 * Interactive bounding box drawing interface following Label Studio design
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ObjectDetectionAnnotation,
  BoundingBox,
  DrawingState,
  CONFIDENCE_LEVELS,
} from "./types";
import {
  generateBoxId,
  normalizeBoundingBox,
  pixelsToPercentage,
  percentageToPixels,
  getColorForLabel,
  isPointInBox,
  formatConfidenceLabel,
  getConfidenceColor,
} from "./utils";

interface ObjectDetectionAnnotatorProps {
  imageUrl: string;
  classes: string[];
  existingAnnotation?: ObjectDetectionAnnotation;
  onAnnotationChange: (annotation: ObjectDetectionAnnotation) => void;
  allowMultipleBoxes?: boolean;
}

export function ObjectDetectionAnnotator({
  imageUrl,
  classes,
  existingAnnotation,
  onAnnotationChange,
  allowMultipleBoxes = true,
}: ObjectDetectionAnnotatorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<BoundingBox[]>(
    existingAnnotation?.bounding_boxes || []
  );
  const [selectedLabel, setSelectedLabel] = useState<string>(classes[0] || "");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [notes, setNotes] = useState(existingAnnotation?.notes || "");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setImageError(true);
      setImageLoaded(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update parent component when annotation changes
  // Note: We update on every change to keep parent in sync,
  // but submission only happens when user clicks Submit button
  useEffect(() => {
    const annotation: ObjectDetectionAnnotation = {
      annotations: boxes,
      bounding_boxes: boxes,
      image_url: imageUrl,
      notes: notes || undefined,
    };
    onAnnotationChange(annotation);
  }, [boxes, notes, imageUrl, onAnnotationChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !selectedLabel) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = pixelsToPercentage(e.clientX - rect.left, rect.width);
    const y = pixelsToPercentage(e.clientY - rect.top, rect.height);

    // Check if clicking on existing box
    const clickedBox = boxes.find((box) => isPointInBox(x, y, box));

    if (clickedBox) {
      setSelectedBoxId(clickedBox.id);
      setIsDragging(true);
      setDragOffset({
        x: x - clickedBox.x,
        y: y - clickedBox.y,
      });
    } else {
      // Start drawing new box
      setDrawingState({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
      setSelectedBoxId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = pixelsToPercentage(e.clientX - rect.left, rect.width);
    const y = pixelsToPercentage(e.clientY - rect.top, rect.height);

    if (isDragging && selectedBoxId) {
      // Move selected box
      const box = boxes.find((b) => b.id === selectedBoxId);
      if (box) {
        const newX = Math.max(0, Math.min(100 - box.width, x - dragOffset.x));
        const newY = Math.max(0, Math.min(100 - box.height, y - dragOffset.y));

        setBoxes((prev) =>
          prev.map((b) =>
            b.id === selectedBoxId ? { ...b, x: newX, y: newY } : b
          )
        );
      }
    } else if (drawingState.isDrawing) {
      // Update current drawing box
      setDrawingState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
    } else {
      // Update hover state
      const hoveredBox = boxes.find((box) => isPointInBox(x, y, box));
      setHoveredBoxId(hoveredBox?.id || null);
    }
  };

  const handleMouseUp = () => {
    if (drawingState.isDrawing) {
      const { startX, startY, currentX, currentY } = drawingState;
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      // Only create box if it has minimum size
      if (width > 1 && height > 1) {
        const normalized = normalizeBoundingBox(
          Math.min(startX, currentX),
          Math.min(startY, currentY),
          width,
          height
        );

        const newBox: BoundingBox = {
          type: 'bbox',
          id: generateBoxId(),
          ...normalized,
          label: selectedLabel,
          confidence: 3, // Default to medium confidence
        };

        setBoxes((prev) => [...prev, newBox]);
      }

      setDrawingState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    }

    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (drawingState.isDrawing || isDragging) {
      handleMouseUp();
    }
    setHoveredBoxId(null);
  };

  const handleDeleteBox = (boxId: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== boxId));
    if (selectedBoxId === boxId) {
      setSelectedBoxId(null);
    }
  };

  const handleUpdateBoxConfidence = (boxId: string, confidence: number) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === boxId ? { ...b, confidence } : b))
    );
  };

  const handleUpdateBoxLabel = (boxId: string, label: string) => {
    setBoxes((prev) => prev.map((b) => (b.id === boxId ? { ...b, label } : b)));
  };

  const selectedBox = boxes.find((b) => b.id === selectedBoxId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              🎯 Draw Bounding Boxes
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Select a class, then click and drag on the image to draw bounding
              boxes
            </p>
          </div>
        </div>
      </div>

      {/* Label Selection */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            Select Object Class
            <span className="text-red-500 text-base">*</span>
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Choose which class to draw boxes for
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
                {boxes.length} {boxes.length === 1 ? "box" : "boxes"} drawn
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
                <p className="text-sm text-red-600 mt-1">
                  Please check the image URL
                </p>
              </div>
            </div>
          )}

          {!imageLoaded && !imageError && (
            <div className="flex items-center justify-center h-96 bg-gray-100 border-2 border-gray-200 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-3"></div>
                <p className="text-base text-gray-600">Loading image...</p>
              </div>
            </div>
          )}

          {imageLoaded && (
            <div
              ref={canvasRef}
              className="relative bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden cursor-crosshair select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ maxHeight: "600px" }}
            >
              <img
                src={imageUrl}
                alt="Annotation target"
                className="w-full h-auto"
                draggable={false}
              />

              {/* Render existing boxes */}
              {boxes.map((box) => {
                const isSelected = box.id === selectedBoxId;
                const isHovered = box.id === hoveredBoxId;
                const color = getColorForLabel(box.label, classes);

                return (
                  <div
                    key={box.id}
                    className={`absolute border-2 ${
                      isSelected ? "border-4" : ""
                    } ${isHovered ? "ring-2 ring-white" : ""}`}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      borderColor: color,
                      backgroundColor: `${color}15`,
                      zIndex: isSelected ? 20 : 10,
                    }}
                  >
                    <div
                      className="absolute -top-7 left-0 px-2 py-1 text-xs font-bold text-white rounded shadow-lg"
                      style={{ backgroundColor: color }}
                    >
                      {box.label}
                    </div>
                  </div>
                );
              })}

              {/* Render current drawing box */}
              {drawingState.isDrawing && (
                <div
                  className="absolute border-2 border-dashed"
                  style={{
                    left: `${Math.min(drawingState.startX, drawingState.currentX)}%`,
                    top: `${Math.min(drawingState.startY, drawingState.currentY)}%`,
                    width: `${Math.abs(drawingState.currentX - drawingState.startX)}%`,
                    height: `${Math.abs(drawingState.currentY - drawingState.startY)}%`,
                    borderColor: getColorForLabel(selectedLabel, classes),
                    backgroundColor: `${getColorForLabel(selectedLabel, classes)}20`,
                  }}
                />
              )}
            </div>
          )}

          <div className="flex items-start gap-2 mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
            <svg
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-semibold">How to use:</p>
              <ul className="mt-1 space-y-0.5">
                <li>• Select a class above</li>
                <li>• Click and drag on the image to draw a bounding box</li>
                <li>• Click a box to select it and adjust properties below</li>
                <li>• Click and drag a box to move it</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Box List */}
      {boxes.length > 0 && (
        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Detected Objects ({boxes.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete all bounding boxes?")) {
                    setBoxes([]);
                    setSelectedBoxId(null);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
            {boxes.map((box, idx) => {
              const isSelected = box.id === selectedBoxId;
              const color = getColorForLabel(box.label, classes);

              return (
                <div
                  key={box.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    isSelected
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : "hover:border-gray-400"
                  }`}
                  style={{ borderColor: color }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: color }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <select
                          value={box.label}
                          onChange={(e) =>
                            handleUpdateBoxLabel(box.id, e.target.value)
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
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          {box.width.toFixed(1)}% × {box.height.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBox(box.id)}
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
                            handleUpdateBoxConfidence(box.id, level.value)
                          }
                          className={`flex-1 px-3 py-2 rounded text-xs font-bold transition-all ${
                            box.confidence === level.value
                              ? `${level.color} text-white ring-2 ring-offset-2 ring-blue-500`
                              : `bg-gray-200 text-gray-700 hover:bg-gray-300`
                          }`}
                        >
                          {level.value}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center">
                      {formatConfidenceLabel(box.confidence)}
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
          <p className="text-xs text-gray-500 mt-1">
            Add any observations or comments about this annotation
          </p>
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
      {boxes.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-green-600 flex-shrink-0"
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
              <p className="text-sm font-bold text-green-900">
                ✓ Annotation Summary
              </p>
              <div className="mt-2 space-y-1 text-xs text-green-800">
                <p>
                  • <strong>{boxes.length}</strong> bounding{" "}
                  {boxes.length === 1 ? "box" : "boxes"} drawn
                </p>
                <p>
                  • Classes detected:{" "}
                  <strong>
                    {Array.from(new Set(boxes.map((b) => b.label))).join(", ")}
                  </strong>
                </p>
                {notes && (
                  <p>
                    • Notes: <strong>{notes.substring(0, 50)}...</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
