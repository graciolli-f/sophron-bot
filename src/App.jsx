import { useState, useEffect } from 'react';
import ChatBox from './components/ChatBox';
import InputBar from './components/InputBar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import { sendMessageToOpenAI, getInitialMessage } from './lib/openai';
import './index.css';

function App() {
  // State for chat messages
  const [messages, setMessages] = useState([]);
  
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  // State for selected debate style
  const [selectedStyle, setSelectedStyle] = useState('');

  // State for fallacy detection toggle
  const [detectFallacies, setDetectFallacies] = useState(false);

  // State for steel-manning mode - new feature
  const [steelManningMode, setSteelManningMode] = useState(false);
  
  // State to track if we're in the strengthening phase - new feature
  const [isStrengtheningPhase, setIsStrengtheningPhase] = useState(false);

  // Initialize chat with bot greeting
  useEffect(() => {
    // Add initial bot message
    setMessages([{ 
      text: getInitialMessage(), 
      sender: 'bot' 
    }]);
  }, []);

  // Handle sending a new message
  const handleSendMessage = async (text) => {
    // If steel-manning mode is enabled and this appears to be a new claim (not already in strengthening phase), start strengthening
    if (steelManningMode && !isStrengtheningPhase && messages.length <= 1) {
      setIsStrengtheningPhase(true);
    }

    // Add user message to the chat
    const updatedMessages = [
      ...messages,
      { text, sender: 'user' }
    ];
    setMessages(updatedMessages);
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Send message to OpenAI and get response, passing all relevant flags including selected style
      const response = await sendMessageToOpenAI(
        updatedMessages, 
        detectFallacies, 
        steelManningMode, 
        isStrengtheningPhase,
        selectedStyle
      );
      
      // Add bot response to the chat
      const newMessages = [
        ...updatedMessages,
        { text: response, sender: 'bot' }
      ];
      setMessages(newMessages);

      // If we're in steel-manning mode and this was the strengthening phase, transition to debate mode
      if (steelManningMode && isStrengtheningPhase) {
        // The bot just provided strengthening suggestions, now we transition to debate mode
        setIsStrengtheningPhase(false);
      }
    } catch (error) {
      // Handle error and add error message to chat
      console.error(error);
      setMessages([
        ...updatedMessages,
        { text: error.message, sender: 'bot' }
      ]);
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  // Handle selecting a predefined topic
  const handleTopicSelect = (topic) => {
    // If steel-manning mode is enabled, start with the strengthening phase
    if (steelManningMode) {
      setIsStrengtheningPhase(true);
    }
    handleSendMessage(topic);
  };

  // Handle selecting a debate style
  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    
    // Style will now be consistently applied to all AI responses through the system prompt
    // No need to send a one-time message since the selectedStyle parameter is passed to every API call
  };

  // Handle fallacy detection toggle
  const handleFallacyToggle = (isEnabled) => {
    setDetectFallacies(isEnabled);
    
    // If we're mid-conversation, notify the user of the change
    if (messages.length > 1) {
      const notificationMessage = isEnabled 
        ? "Fallacy detection is now enabled. I will interrupt to point out logical fallacies in your arguments."
        : "Fallacy detection is now disabled. I will not interrupt to point out logical fallacies.";
      
      setMessages([
        ...messages,
        { text: notificationMessage, sender: 'bot' }
      ]);
    }
  };

  // Handle steel-manning mode toggle - new feature
  const handleSteelManningToggle = (isEnabled) => {
    setSteelManningMode(isEnabled);
    
    // Reset strengthening phase when toggling steel-manning mode
    if (!isEnabled) {
      setIsStrengtheningPhase(false);
    }
    
    // If we're mid-conversation, notify the user of the change
    if (messages.length > 1) {
      const notificationMessage = isEnabled 
        ? "Steel-manning mode is now enabled. I will help strengthen your arguments before debating them."
        : "Steel-manning mode is now disabled. I will debate your arguments as-is.";
      
      setMessages([
        ...messages,
        { text: notificationMessage, sender: 'bot' }
      ]);
    }
  };
  
  return (
    <div className="flex flex-1 h-screen bg-base-100">
      {/* Left Sidebar - Topic selection, debate styles, modes, and settings */}
      <LeftSidebar 
        onTopicSelect={handleTopicSelect} 
        onStyleSelect={handleStyleSelect}
        selectedStyle={selectedStyle}
        detectFallacies={detectFallacies}
        onFallacyToggle={handleFallacyToggle}
        steelManningMode={steelManningMode}
        onSteelManningToggle={handleSteelManningToggle}
      />
      
      {/* Main Content Area - Chat interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="text-center py-6 px-8 border-b border-base-300">
          <h1 className="text-3xl font-bold mb-2">sophron-bot</h1>
          <p className="text-sm opacity-70">
            Debate philosophical ideas with an AI trained in logical reasoning
          </p>
        </header>

        {/* Chat Area - takes up remaining space */}
        <div className="flex-1 flex flex-col p-6">
          {/* Chat messages */}
          <div className="flex-1 mb-4">
            <ChatBox messages={messages} />
          </div>
          
          {/* Input field */}
          <InputBar 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
          />
        </div>

        {/* Footer */}
        <footer className="text-center py-4 px-8 border-t border-base-300">
          <p className="text-xs opacity-50">
            Powered by OpenAI gpt-4o-mini-2024-07-18
          </p>
        </footer>
      </div>

      {/* Right Sidebar - Context information and references */}
      <RightSidebar />
    </div>
  );
}

export default App;
