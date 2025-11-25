/**
 * Object Detection Task Creation Component
 * Label Studio-inspired interface for setting up object detection tasks
 */

import React, { useState, useEffect } from "react";
import {
  ObjectDetectionData,
  BoundingBox,
} from "./types";
import {
  validateImageUrl,
  validateClasses,
  parseClassesFromString,
  getImageDimensions,
  validateObjectDetectionData,
  generateBoxId,
  getColorForLabel,
} from "./utils";

interface ObjectDetectionTaskProps {
  onDataChange: (data: ObjectDetectionData | null) => void;
  initialData?: ObjectDetectionData;
}

export function ObjectDetectionTask({
  onDataChange,
  initialData,
}: ObjectDetectionTaskProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [classes, setClasses] = useState<string[]>(
    initialData?.classes || []
  );
  const [classInput, setClassInput] = useState("");
  const [bulkClassInput, setBulkClassInput] = useState(
    initialData?.classes?.join(", ") || ""
  );
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [allowMultipleBoxes, setAllowMultipleBoxes] = useState(
    initialData?.allow_multiple_boxes ?? true
  );

  // Validate and update parent whenever data changes
  useEffect(() => {
    if (imageUrl && classes.length > 0) {
      const data: ObjectDetectionData = {
        image_url: imageUrl,
        classes,
        description: description || undefined,
        image_width: imageDimensions?.width,
        image_height: imageDimensions?.height,
        allow_multiple_boxes: allowMultipleBoxes,
      };

      const validation = validateObjectDetectionData(data);
      if (validation.valid) {
        onDataChange(data);
      } else {
        onDataChange(null);
      }
    } else {
      onDataChange(null);
    }
  }, [imageUrl, classes, description, imageDimensions, allowMultipleBoxes]);

  // Load image when URL changes
  useEffect(() => {
    if (validateImageUrl(imageUrl)) {
      setImageLoading(true);
      setImageError(false);

      getImageDimensions(imageUrl)
        .then((dims) => {
          setImageDimensions(dims);
          setImageLoaded(true);
          setImageError(false);
        })
        .catch(() => {
          setImageError(true);
          setImageLoaded(false);
        })
        .finally(() => {
          setImageLoading(false);
        });
    } else {
      setImageLoaded(false);
      setImageDimensions(null);
    }
  }, [imageUrl]);

  const handleBulkClassInput = (value: string) => {
    setBulkClassInput(value);
    const parsedClasses = parseClassesFromString(value);
    setClasses(parsedClasses);
  };

  const handleAddSingleClass = () => {
    if (classInput.trim() && !classes.includes(classInput.trim())) {
      const newClasses = [...classes, classInput.trim()];
      setClasses(newClasses);
      setBulkClassInput(newClasses.join(", "));
      setClassInput("");
    }
  };

  const handleRemoveClass = (classToRemove: string) => {
    const newClasses = classes.filter((c) => c !== classToRemove);
    setClasses(newClasses);
    setBulkClassInput(newClasses.join(", "));
  };

  const validation = validateObjectDetectionData({
    image_url: imageUrl,
    classes,
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              🎯 Object Detection Task
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure image and object classes for bounding box annotation
            </p>
          </div>
        </div>
      </div>

      {/* Image URL Section */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              Image URL
              <span className="text-red-500 text-base">*</span>
            </h4>
            {imageDimensions && (
              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded border border-gray-300 font-mono">
                {imageDimensions.width} × {imageDimensions.height}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Provide a public URL to the image for object detection
          </p>
        </div>

        <div className="p-5 space-y-4">
          <input
            type="url"
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />

          {imageUrl && !validateImageUrl(imageUrl) && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Please enter a valid image URL
            </div>
          )}

          <p className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Must be a publicly accessible image URL (JPG, PNG, WEBP, etc.)
          </p>

          {/* Image Preview */}
          {validateImageUrl(imageUrl) && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Preview
              </p>
              <div className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                {imageLoading && (
                  <div className="flex items-center justify-center h-64 bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-sm text-gray-500">Loading image...</p>
                    </div>
                  </div>
                )}

                {imageError && (
                  <div className="flex items-center justify-center h-64 bg-red-50">
                    <div className="text-center">
                      <svg
                        className="w-12 h-12 text-red-400 mx-auto mb-3"
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
                      <p className="text-sm text-red-600 font-medium">
                        Failed to load image
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        Please check the URL and try again
                      </p>
                    </div>
                  </div>
                )}

                {imageLoaded && !imageError && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                )}
              </div>

              {imageLoaded && (
                <div className="flex items-center gap-2 mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Image loaded successfully
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Object Classes Section */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
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
              Object Classes
              <span className="text-red-500 text-base">*</span>
            </h4>
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded border border-gray-300 font-semibold">
              Min. 1 required
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Define the object types that annotators will detect and label
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Bulk Input */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
              Comma-separated classes
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={bulkClassInput}
              onChange={(e) => handleBulkClassInput(e.target.value)}
              placeholder="person, car, dog, cat, bicycle, tree"
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Separate multiple classes with commas
            </p>
          </div>

          {/* OR Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500 font-semibold">
                OR
              </span>
            </div>
          </div>

          {/* Single Class Input */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <label className="text-xs font-semibold text-blue-900 mb-2 block uppercase tracking-wide">
              Add classes one by one
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2.5 text-base border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSingleClass();
                  }
                }}
                placeholder="Enter a class name..."
              />
              <button
                type="button"
                onClick={handleAddSingleClass}
                disabled={!classInput.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add
              </button>
            </div>
          </div>

          {/* Classes Preview */}
          {classes.length > 0 && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Active Classes ({classes.length})
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setClasses([]);
                    setBulkClassInput("");
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {classes.map((cls, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: `${getColorForLabel(cls, classes)}20`,
                      borderColor: getColorForLabel(cls, classes),
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getColorForLabel(cls, classes),
                      }}
                    ></div>
                    <span className="text-sm font-semibold text-gray-900">
                      {cls}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClass(cls)}
                      className="ml-1 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
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
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
            Annotation Settings
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Configure annotation behavior
          </p>
        </div>

        <div className="p-5">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={allowMultipleBoxes}
              onChange={(e) => setAllowMultipleBoxes(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mt-0.5"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900">
                Allow multiple boxes per class
              </span>
              <p className="text-xs text-gray-600 mt-1">
                When enabled, annotators can draw multiple bounding boxes for
                the same object class in a single image
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Optional Description */}
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
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Task Description
            <span className="text-xs text-gray-500 font-normal normal-case tracking-normal">
              (Optional)
            </span>
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Provide additional context or instructions for annotators
          </p>
        </div>

        <div className="p-5">
          <textarea
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any special instructions, context, or guidelines for annotators...&#10;&#10;Example: Focus on detecting vehicles in motion. Include partially visible objects."
          />
        </div>
      </div>

      {/* Validation Summary */}
      <div
        className={`border-2 rounded-lg p-4 ${
          validation.valid
            ? "bg-green-50 border-green-300"
            : "bg-amber-50 border-amber-300"
        }`}
      >
        {validation.valid ? (
          <div className="flex items-center gap-3">
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
                ✓ Task Configuration Complete
              </p>
              <p className="text-xs text-green-700 mt-1">
                All required fields are filled. Ready to create task.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">
                Please complete required fields
              </p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
