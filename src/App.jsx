import { useState, useEffect } from 'react';
import ChatBox from './components/ChatBox';
import InputBar from './components/InputBar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import { sendMessageToOpenAI, getInitialMessage } from './lib/openai';
import { detectFallacies as detectFallaciesAPI, formatFallaciesForDisplay } from './lib/fallacyService';
import { analyzeSteelManning, formatImprovementsForDisplay } from './lib/steelManService';
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

  // State for debate mode toggle - if true, AI takes opposite position automatically
  const [isDebateMode, setIsDebateMode] = useState(false);

  // State for right sidebar visibility - new feature
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);

  // State for detected logical fallacies - new helper functionality
  const [detectedFallacies, setDetectedFallacies] = useState([]);

  // State for steel manning suggestions - new helper functionality
  const [steelManningSuggestions, setSteelManningSuggestions] = useState([]);

  // Initialize chat with bot greeting
  useEffect(() => {
    // Add initial bot message
    setMessages([{ 
      text: getInitialMessage(isDebateMode), 
      sender: 'bot' 
    }]);
  }, [isDebateMode]);

  // Handle sending a new message
  const handleSendMessage = async (text) => {
    // If steel-manning mode is enabled and this appears to be a new claim (not already in strengthening phase), start strengthening
    if (steelManningMode && !isStrengtheningPhase && messages.length <= 1) {
      setIsStrengtheningPhase(true);
    }

    // Check for fallacies in user message BEFORE sending to chat (if fallacy detection is enabled)
    if (detectFallacies) {
      try {
        const fallacyResult = await detectFallaciesAPI(text);
        if (fallacyResult.hasFallacies && fallacyResult.fallacies.length > 0) {
          const formattedFallacies = formatFallaciesForDisplay(fallacyResult.fallacies);
          setDetectedFallacies(prev => [...prev, ...formattedFallacies]);
          // Ensure sidebar is visible when fallacies are detected
          setIsRightSidebarVisible(true);
        }
      } catch (error) {
        console.error('Error detecting fallacies:', error);
        // Continue with chat even if fallacy detection fails
      }
    }

    // Check for steel manning improvements (if steel manning mode is enabled)
    if (steelManningMode) {
      try {
        const steelManResult = await analyzeSteelManning(text);
        if (steelManResult.hasImprovements && steelManResult.improvements.length > 0) {
          const formattedImprovements = formatImprovementsForDisplay(steelManResult.improvements);
          setSteelManningSuggestions(prev => [...prev, ...formattedImprovements]);
          // Ensure sidebar is visible when improvements are suggested
          setIsRightSidebarVisible(true);
        }
      } catch (error) {
        console.error('Error analyzing steel manning:', error);
        // Continue with chat even if steel manning analysis fails
      }
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
      // Note: We no longer pass detectFallacies to the chat API since fallacy detection is handled separately
      const response = await sendMessageToOpenAI(
        updatedMessages, 
        false, // Don't use fallacy detection in main chat anymore
        steelManningMode, 
        isStrengtheningPhase,
        selectedStyle,
        isDebateMode
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
        ? "Fallacy detection is now enabled. Your messages will be analyzed for logical fallacies and displayed in the sidebar."
        : "Fallacy detection is now disabled. Your messages will not be analyzed for logical fallacies.";
      
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

  // Handle right sidebar toggle - new feature
  const handleRightSidebarToggle = () => {
    setIsRightSidebarVisible(!isRightSidebarVisible);
  };

  // Handle debate mode toggle - new feature
  const handleDebateModeToggle = (isEnabled) => {
    setIsDebateMode(isEnabled);
    
    // If we're mid-conversation, notify the user of the change
    if (messages.length > 1) {
      const notificationMessage = isEnabled 
        ? "Debate mode is now enabled. I will automatically take the opposite position to your arguments."
        : "Learn mode is now enabled. I will act as your educational debate partner.";
      
      setMessages([
        ...messages,
        { text: notificationMessage, sender: 'bot' }
      ]);
    }
  };

  // Handle clearing detected fallacies - new helper functionality
  const handleClearFallacies = () => {
    setDetectedFallacies([]);
  };

  // Handle clearing steel manning suggestions - new helper functionality
  const handleClearSteelManning = () => {
    setSteelManningSuggestions([]);
  };

  // Function to manually add a fallacy for testing purposes
  const addTestFallacy = (fallacyName = 'Test Fallacy') => {
    const testFallacy = {
      id: `fallacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: fallacyName,
      detectedAt: new Date(),
      context: 'This is a test fallacy added manually to verify the system works.',
      explanation: 'This fallacy was added for testing purposes.',
      suggestion: 'This is just a test - you can clear it using the Clear All button.'
    };
    
    setDetectedFallacies(prev => [...prev, testFallacy]);
    setIsRightSidebarVisible(true);
  };
  
  return (
    <div className="flex h-screen bg-base-100 overflow-hidden">
      {/* Left Sidebar - Topic selection, debate styles, modes, and settings */}
      <LeftSidebar 
        onTopicSelect={handleTopicSelect} 
        onStyleSelect={handleStyleSelect}
        selectedStyle={selectedStyle}
        detectFallacies={detectFallacies}
        onFallacyToggle={handleFallacyToggle}
        steelManningMode={steelManningMode}
        onSteelManningToggle={handleSteelManningToggle}
        isDebateMode={isDebateMode}
        onDebateModeToggle={handleDebateModeToggle}
      />
      
      {/* Main Content Area - Chat interface */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="text-center py-6 px-8 border-b border-base-300 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">sophron-bot</h1>
              <p className="text-sm opacity-70">
                Debate philosophical ideas with an AI trained in logical reasoning
              </p>
            </div>
            <div className="flex-1 flex justify-end items-center space-x-2">
              <button
                onClick={handleRightSidebarToggle}
                className="btn btn-ghost btn-sm"
                title={isRightSidebarVisible ? "Hide fallacy helper" : "Show fallacy helper"}
              >
                {isRightSidebarVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Chat Area - takes up remaining space */}
        <div className="flex-1 flex flex-col p-6 min-h-0">
          {/* Chat messages */}
          <div className="flex-1 mb-4 min-h-0">
            <ChatBox 
              messages={messages} 
            />
          </div>
          
          {/* Input field */}
          <div className="flex-shrink-0">
            <InputBar 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 px-8 border-t border-base-300 flex-shrink-0">
          <p className="text-xs opacity-50">
            Powered by OpenAI gpt-4o-mini-2024-07-18 • Enhanced with Wikipedia & SEP
          </p>
        </footer>
      </div>

      {/* Right Sidebar - Context information and references */}
      {isRightSidebarVisible && (
        <RightSidebar 
          detectFallacies={detectFallacies}
          detectedFallacies={detectedFallacies}
          onClearFallacies={handleClearFallacies}
          onAddTestFallacy={addTestFallacy}
          steelManningMode={steelManningMode}
          steelManningSuggestions={steelManningSuggestions}
          onClearSteelManning={handleClearSteelManning}
        />
      )}
    </div>
  );
}

export default App;
