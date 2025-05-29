// Service for detecting logical fallacies in user messages

/**
 * Analyzes a user message for logical fallacies using the backend API
 * @param {string} userMessage - The message to analyze
 * @returns {Promise<Object>} - Object containing fallacy detection results
 */
export const detectFallacies = async (userMessage) => {
  try {
    const response = await fetch('/api/detect-fallacies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to detect fallacies');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error detecting fallacies:', error);
    
    // Return safe fallback
    return {
      hasFallacies: false,
      fallacies: [],
      error: error.message
    };
  }
};

/**
 * Formats fallacy data for display in the sidebar
 * @param {Array} fallacies - Array of fallacy objects from the API
 * @returns {Array} - Formatted fallacy objects for the UI
 */
export const formatFallaciesForDisplay = (fallacies) => {
  return fallacies.map((fallacy, index) => ({
    id: `fallacy-${Date.now()}-${index}`,
    name: fallacy.name,
    detectedAt: new Date(),
    context: `Detected in your message: "${fallacy.explanation}"`,
    explanation: fallacy.explanation,
    suggestion: fallacy.suggestion || 'Consider revising your argument to address this logical error.'
  }));
}; 