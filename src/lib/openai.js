// OpenAI API service for the sophron-bot chat interface

// API base URL configuration - uses environment variable for deployed backend
const API_BASE = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3001');

// Function to get initial greeting
export const getInitialMessage = (isDebateMode = false) => {
  return isDebateMode 
    ? "What position would you like me to argue against? I'll automatically take the opposite stance and engage you in real debate."
    : "What belief or claim would you like to debate?";
};

// Function to send a message to the backend API
export const sendMessageToOpenAI = async (messages, detectFallacies = false, steelManningMode = false, isStrengtheningPhase = false, selectedStyle = '', isDebateMode = false) => {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        detectFallacies,
        steelManningMode,
        isStrengtheningPhase,
        selectedStyle,
        isDebateMode
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from AI');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error calling backend API:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('fetch')) {
      throw new Error('Unable to connect to the server. Please make sure the server is running.');
    }
    
    throw error;
  }
}; 