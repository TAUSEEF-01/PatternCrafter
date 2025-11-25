import { useState, useEffect } from "react";
import {
  ImageClassificationAnnotation,
  ImageClassificationData,
  CONFIDENCE_LEVELS,
} from "./types";
import { formatConfidenceLabel, getConfidenceColor } from "./utils";

interface ImageClassificationAnnotatorProps {
  taskData: ImageClassificationData;
  initialAnnotation?: ImageClassificationAnnotation;
  onAnnotationChange: (annotation: ImageClassificationAnnotation) => void;
  readonly?: boolean;
}

/**
 * Image Classification Annotator Component
 * Provides Label Studio-style interface for annotating image classification tasks
 */
export default function ImageClassificationAnnotator({
  taskData,
  initialAnnotation,
  onAnnotationChange,
  readonly = false,
}: ImageClassificationAnnotatorProps) {
  const [selectedLabel, setSelectedLabel] = useState<string>(
    initialAnnotation?.selected_label || ""
  );
  const [confidence, setConfidence] = useState<number>(
    initialAnnotation?.confidence || 3
  );
  const [notes, setNotes] = useState<string>(initialAnnotation?.notes || "");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Update parent component when annotation changes
  useEffect(() => {
    if (selectedLabel) {
      onAnnotationChange({
        selected_label: selectedLabel,
        confidence,
        notes: notes || undefined,
      });
    }
  }, [selectedLabel, confidence, notes]);

  const handleLabelSelect = (label: string) => {
    if (!readonly) {
      setSelectedLabel(label);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            {readonly ? "Image Classification Result" : "Classify This Image"}
          </h3>
        </div>
        {taskData.description && (
          <p className="text-sm text-gray-600 mt-2 bg-blue-50 border border-blue-200 rounded p-3">
            {taskData.description}
          </p>
        )}
      </div>

      {/* Image Display */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Image to Classify
          </h4>
        </div>
        <div className="p-5">
          <div className="relative bg-gray-100 border-2 border-gray-200 rounded-lg overflow-hidden">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 min-h-[300px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading image...</p>
                </div>
              </div>
            )}

            {imageError && (
              <div className="flex items-center justify-center bg-red-50 min-h-[300px]">
                <div className="text-center p-4">
                  <svg
                    className="w-12 h-12 text-red-500 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-red-700">
                    Failed to load image
                  </p>
                </div>
              </div>
            )}

            <img
              src={taskData.image_url}
              alt="Image to classify"
              className="w-full h-auto max-h-[500px] object-contain mx-auto"
              onLoad={() => {
                setImageLoaded(true);
                setImageError(false);
              }}
              onError={() => {
                setImageLoaded(false);
                setImageError(true);
              }}
              style={{
                display: imageLoaded ? "block" : "none",
              }}
            />
          </div>

          {taskData.metadata && imageLoaded && (
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
              {taskData.metadata.width && taskData.metadata.height && (
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-mono">
                    {taskData.metadata.width} × {taskData.metadata.height}
                  </span>
                </div>
              )}
              {taskData.metadata.format && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Format:</span>
                  <span className="font-mono">{taskData.metadata.format}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Label Selection */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Select Classification Label
            </h4>
            {!readonly && (
              <span className="text-xs text-red-500 font-semibold">
                * Required
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Choose the most appropriate label for this image
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {taskData.labels.map((label, index) => {
              const isSelected = selectedLabel === label;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleLabelSelect(label)}
                  disabled={readonly}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all text-left
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-300"
                        : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                    }
                    ${readonly ? "cursor-default" : "cursor-pointer"}
                    disabled:opacity-50
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-base font-semibold ${
                        isSelected ? "text-blue-900" : "text-gray-700"
                      }`}
                    >
                      {label}
                    </span>
                    {isSelected && (
                      <svg
                        className="w-6 h-6 text-blue-600 flex-shrink-0"
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
                  </div>
                </button>
              );
            })}
          </div>

          {!selectedLabel && !readonly && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-amber-800">
                Please select a label to continue
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confidence Level */}
      {selectedLabel && (
        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Confidence Level
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              How confident are you in this classification?
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              {CONFIDENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => !readonly && setConfidence(level.value)}
                  disabled={readonly}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                    ${
                      confidence === level.value
                        ? `border-${level.color.replace(
                            "bg-",
                            ""
                          )} ${level.color} bg-opacity-20 ring-2 ring-${level.color.replace(
                            "bg-",
                            ""
                          )}`
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }
                    ${readonly ? "cursor-default" : "cursor-pointer"}
                    disabled:opacity-50
                  `}
                >
                  <div
                    className={`
                    w-8 h-8 rounded-full ${level.color} text-white font-bold
                    flex items-center justify-center text-sm
                  `}
                  >
                    {level.value}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">
                    {level.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${getConfidenceColor(
                    confidence
                  )} text-white font-bold flex items-center justify-center text-lg`}
                >
                  {confidence}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900">
                    Current Confidence: {formatConfidenceLabel(confidence)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {confidence <= 2 &&
                      "Consider reviewing the image again or seeking additional context"}
                    {confidence === 3 && "Moderately confident in this classification"}
                    {confidence >= 4 &&
                      "Highly confident in this classification"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {selectedLabel && (
        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Additional Notes
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Optional comments or observations about this classification
            </p>
          </div>
          <div className="p-5">
            <textarea
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              rows={4}
              value={notes}
              onChange={(e) => !readonly && setNotes(e.target.value)}
              placeholder="Add any relevant notes, observations, or reasons for your classification..."
              disabled={readonly}
            />
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedLabel && !readonly && (
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
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Selected Label:</span>
                  <span className="px-2 py-1 bg-green-200 border border-green-400 rounded font-bold">
                    {selectedLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Confidence:</span>
                  <span
                    className={`px-2 py-1 ${getConfidenceColor(
                      confidence
                    )} text-white rounded font-bold`}
                  >
                    {formatConfidenceLabel(confidence)}
                  </span>
                </div>
                {notes && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <span className="font-semibold">Notes: </span>
                    <span>{notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
