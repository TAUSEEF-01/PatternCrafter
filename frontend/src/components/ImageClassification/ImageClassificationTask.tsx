import { useState, useEffect } from "react";
import { ImageClassificationState, ImageClassificationData } from "./types";
import {
  validateImageUrl,
  validateLabels,
  parseLabelsFromString,
  getImageDimensions,
  generateImageTags,
} from "./utils";

interface ImageClassificationTaskProps {
  onDataChange: (data: ImageClassificationData) => void;
  initialData?: Partial<ImageClassificationData>;
}

/**
 * Image Classification Task Creation Component
 * Follows Label Studio's design patterns for image classification
 */
export default function ImageClassificationTask({
  onDataChange,
  initialData,
}: ImageClassificationTaskProps) {
  const [state, setState] = useState<ImageClassificationState>({
    imageUrl: initialData?.image_url || "",
    labels: initialData?.labels || [],
    description: initialData?.description || "",
    newLabel: "",
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [labelsInput, setLabelsInput] = useState(
    initialData?.labels?.join(", ") || ""
  );
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [tagGenerationError, setTagGenerationError] = useState<string | null>(
    null
  );

  // Validate and update parent component
  useEffect(() => {
    const isValid =
      validateImageUrl(state.imageUrl) && validateLabels(state.labels);

    if (isValid) {
      onDataChange({
        image_url: state.imageUrl,
        labels: state.labels,
        description: state.description || undefined,
        metadata: imageDimensions
          ? {
              width: imageDimensions.width,
              height: imageDimensions.height,
            }
          : undefined,
      });
    }
  }, [state, imageDimensions]);

  // Handle image URL change
  const handleImageUrlChange = (url: string) => {
    setState((prev) => ({ ...prev, imageUrl: url }));
    setImageLoaded(false);
    setImageError(false);
    setImageDimensions(null);

    if (validateImageUrl(url)) {
      getImageDimensions(url)
        .then((dims) => setImageDimensions(dims))
        .catch(() => {});
    }
  };

  // Handle labels bulk input
  const handleLabelsInputChange = (input: string) => {
    setLabelsInput(input);
    const parsedLabels = parseLabelsFromString(input);
    setState((prev) => ({ ...prev, labels: parsedLabels }));
  };

  // Add individual label
  const addLabel = () => {
    if (
      state.newLabel.trim() &&
      !state.labels.includes(state.newLabel.trim())
    ) {
      const newLabels = [...state.labels, state.newLabel.trim()];
      setState((prev) => ({ ...prev, labels: newLabels, newLabel: "" }));
      setLabelsInput(newLabels.join(", "));
    }
  };

  // Remove label
  const removeLabel = (labelToRemove: string) => {
    const newLabels = state.labels.filter((label) => label !== labelToRemove);
    setState((prev) => ({ ...prev, labels: newLabels }));
    setLabelsInput(newLabels.join(", "));
  };

  // Auto-generate tags using Gemini API
  const handleGenerateTags = async () => {
    if (!validateImageUrl(state.imageUrl) || !imageLoaded) {
      setTagGenerationError(
        "Please enter a valid image URL and wait for it to load"
      );
      return;
    }

    setIsGeneratingTags(true);
    setTagGenerationError(null);

    try {
      const generatedTags = await generateImageTags(state.imageUrl);
      if (generatedTags.length > 0) {
        // Merge with existing labels, avoiding duplicates
        const existingLabels = new Set(
          state.labels.map((l) => l.toLowerCase())
        );
        const newLabels = [
          ...state.labels,
          ...generatedTags.filter(
            (tag) => !existingLabels.has(tag.toLowerCase())
          ),
        ];
        setState((prev) => ({ ...prev, labels: newLabels }));
        setLabelsInput(newLabels.join(", "));
      }
    } catch (error) {
      console.error("Failed to generate tags:", error);
      setTagGenerationError(
        "Failed to generate tags. Please try again or add labels manually."
      );
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const isValidSetup =
    validateImageUrl(state.imageUrl) && validateLabels(state.labels);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white border-b-2 border-gray-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Image Classification Task
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure image and labels for single-label classification
            </p>
          </div>
        </div>
      </div>

      {/* Image URL Section */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Image URL
            </h4>
            <span className="text-xs text-red-500 font-semibold">
              * Required
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Provide a public URL to the image to be classified
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <input
              type="url"
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={state.imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Must be a publicly accessible image URL
              </p>
              {imageDimensions && (
                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                  {imageDimensions.width} × {imageDimensions.height}
                </span>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {state.imageUrl && (
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-4 h-4 text-blue-600"
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
                <h5 className="text-sm font-bold text-gray-700">
                  Image Preview
                </h5>
              </div>

              <div className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading image...</p>
                    </div>
                  </div>
                )}

                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50">
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
                      <p className="text-xs text-red-600 mt-1">
                        Please check the URL and try again
                      </p>
                    </div>
                  </div>
                )}

                <img
                  src={state.imageUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain"
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

              {imageLoaded && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
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
                    <span className="font-semibold">
                      Image loaded successfully
                    </span>
                  </div>

                  {/* Auto-generate Tags Button */}
                  <button
                    type="button"
                    onClick={handleGenerateTags}
                    disabled={isGeneratingTags}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    {isGeneratingTags ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Generating Tags with AI...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span>Auto-Generate Tags with AI</span>
                      </>
                    )}
                  </button>

                  {tagGenerationError && (
                    <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{tagGenerationError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Labels Section */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Classification Labels
            </h4>
            <span className="text-xs text-red-500 font-semibold">
              * Min. 2 required
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Define the possible classes for image classification
          </p>
        </div>
        <div className="p-5 space-y-4">
          {/* Bulk Input */}
          {/* <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 block">
              Comma-separated labels
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={labelsInput}
              onChange={(e) => handleLabelsInputChange(e.target.value)}
              placeholder="cat, dog, bird, fish"
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Separate multiple labels with commas
            </p>
          </div> */}

          {/* Individual Label Addition */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <label className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 block">
              Or add labels one by one
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 text-base border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                value={state.newLabel}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, newLabel: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
                placeholder="Enter a label..."
              />
              <button
                type="button"
                onClick={addLabel}
                disabled={!state.newLabel.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
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

          {/* Labels Display */}
          {state.labels.length > 0 && (
            <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-bold text-gray-700">
                  Active Labels ({state.labels.length})
                </h5>
                {state.labels.length < 2 && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-semibold">
                    Add at least 2 labels
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {state.labels.map((label, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 border-2 border-blue-300 rounded-lg hover:border-blue-400 transition-colors group"
                  >
                    <span className="text-sm font-semibold text-blue-900">
                      {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="text-blue-700 hover:text-red-600 transition-colors"
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

          {state.labels.length === 0 && (
            <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-2"
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
              <p className="text-sm text-gray-500">No labels added yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Add labels using the inputs above
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Optional Description Section */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b-2 border-gray-300 px-5 py-3">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Task Description
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Optional instructions or context for annotators
          </p>
        </div>
        <div className="p-5">
          <textarea
            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            rows={3}
            value={state.description}
            onChange={(e) =>
              setState((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Add any special instructions or context for this classification task..."
          />
        </div>
      </div>

      {/* Validation Summary */}
      {!isValidSetup && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 flex items-start gap-4">
          <svg
            className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5"
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
            <p className="text-sm font-bold text-amber-900 mb-1">
              Required Fields Missing
            </p>
            <ul className="text-xs text-amber-800 space-y-1">
              {!validateImageUrl(state.imageUrl) && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                  Valid image URL is required
                </li>
              )}
              {!validateLabels(state.labels) && (
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                  At least 2 valid labels are required
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Success Indicator */}
      {isValidSetup && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-5 flex items-center gap-4">
          <svg
            className="w-7 h-7 text-green-600 flex-shrink-0"
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
              Task Configuration Complete
            </p>
            <p className="text-xs text-green-800 mt-1">
              All required fields are filled. Ready to create task.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
