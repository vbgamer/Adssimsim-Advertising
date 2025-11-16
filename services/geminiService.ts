// GeminiService.ts — Disabled version (no API key required)
// This mock replaces Gemini AI features to prevent runtime errors.

console.warn("⚠️ Gemini AI has been disabled — no API key set.");

/**
 * Generates an ad creative placeholder (mock).
 * Returns a static placeholder image instead of calling Gemini API.
 */
export const generateAdCreative = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' = '16:9'
): Promise<string> => {
  console.log("Mock image generation for prompt:", prompt);

  // Return a simple placeholder image (free & safe)
  const placeholderUrl = "https://via.placeholder.com/600x400?text=Ad+Creative";
  return placeholderUrl;
};
