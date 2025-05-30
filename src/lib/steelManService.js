// Service for steel manning user arguments

// API base URL configuration - uses environment variable for deployed backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Analyzes a user message for potential improvements using steel manning
 * @param {string} userMessage - The message to analyze
 * @returns {Promise<Object>} - Object containing steel manning suggestions
 */
export const analyzeSteelManning = async (userMessage) => {
  try {
    const response = await fetch(`${API_BASE}/api/steel-man`, {
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
      throw new Error(errorData.error || 'Failed to analyze argument for steel manning');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing steel manning:', error);
    
    // Return safe fallback
    return {
      hasImprovements: false,
      improvements: [],
      error: error.message
    };
  }
};

/**
 * Formats steel manning suggestions for display in the sidebar
 * @param {Array} improvements - Array of improvement objects from the API
 * @returns {Array} - Formatted improvement objects for the UI
 */
export const formatImprovementsForDisplay = (improvements) => {
  return improvements.map((improvement, index) => ({
    id: `improvement-${Date.now()}-${index}`,
    category: improvement.category,
    suggestion: improvement.suggestion,
    reason: improvement.reason,
    example: improvement.example,
    detectedAt: new Date()
  }));
}; 