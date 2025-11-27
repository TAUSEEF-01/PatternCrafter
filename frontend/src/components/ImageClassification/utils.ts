/**
 * Image Classification Utility Functions
 */

// Gemini API Key
const GEMINI_API_KEY = "AIzaSyBsYbjjtlMI7kHt24dXIW03QWolY4lA6Fg";

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

/**
 * Generate image classification tags using Gemini API
 * @param imageUrl - URL of the image to analyze
 * @returns Promise<string[]> - Array of generated tags/labels
 */
export const generateImageTags = async (
  imageUrl: string
): Promise<string[]> => {
  try {
    // Try to fetch and convert image to base64 first
    let requestBody;

    try {
      // Attempt to fetch the image (may fail due to CORS)
      const imageResponse = await fetch(imageUrl, { mode: "cors" });
      if (imageResponse.ok) {
        const imageBlob = await imageResponse.blob();
        const base64Image = await blobToBase64(imageBlob);
        const mimeType = imageBlob.type || "image/jpeg";

        requestBody = {
          contents: [
            {
              parts: [
                {
                  text: `Analyze this image and generate classification labels/tags for it. 
Return ONLY a comma-separated list of 5-10 relevant classification labels that could be used for image classification tasks.
The labels should be single words or short phrases that describe:
- What objects are in the image
- The scene or setting
- Key characteristics or attributes

Example output format: dog, animal, pet, outdoor, running, brown, happy

Only return the comma-separated labels, nothing else.`,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image.split(",")[1],
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 200,
          },
        };
      } else {
        throw new Error("Image fetch failed");
      }
    } catch (corsError) {
      // If CORS fails, use URL-based approach with file_data
      console.log("Using URL-based approach due to CORS:", corsError);
      requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Analyze this image and generate classification labels/tags for it. 
Return ONLY a comma-separated list of 5-10 relevant classification labels that could be used for image classification tasks.
The labels should be single words or short phrases that describe:
- What objects are in the image
- The scene or setting
- Key characteristics or attributes

Example output format: dog, animal, pet, outdoor, running, brown, happy

Only return the comma-separated labels, nothing else.

Image URL: ${imageUrl}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 200,
        },
      };
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API error response:", errorData);
      throw new Error(
        `Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    console.log("Gemini API response:", data);

    // Extract the text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      throw new Error("No text generated from Gemini API");
    }

    // Parse the comma-separated labels
    const labels = generatedText
      .split(",")
      .map((label: string) => label.trim().toLowerCase())
      .filter((label: string) => label.length > 0 && label.length < 50);

    if (labels.length === 0) {
      throw new Error("No valid labels parsed from response");
    }

    return labels;
  } catch (error) {
    console.error("Error generating image tags:", error);
    throw error;
  }
};

/**
 * Convert Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
