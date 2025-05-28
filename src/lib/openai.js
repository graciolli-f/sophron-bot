// Function to get initial greeting
export const getInitialMessage = () => {
  return "What belief or claim would you like to debate?";
};

// Function to send a message to the backend API
export const sendMessageToOpenAI = async (messages, detectFallacies = false, steelManningMode = false, isStrengtheningPhase = false, selectedStyle = '') => {
  console.log('🌐 API call parameters:', {
    detectFallacies,
    steelManningMode,
    isStrengtheningPhase,
    selectedStyle,
    messageCount: messages.length
  });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        detectFallacies,
        steelManningMode,
        isStrengtheningPhase,
        selectedStyle
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from AI');
    }

    const data = await response.json();
    console.log('📥 Received response from API');
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