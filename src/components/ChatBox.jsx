import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// ChatBox component to display messages between user and bot
const ChatBox = ({ messages }) => {
  // Reference to the message container for auto-scrolling
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-base-300 rounded-box p-4 h-full overflow-y-auto chat-scrollbar">
      {/* Map through messages and display them */}
      {messages.map((message, index) => (
        <div 
          key={index} 
          className={`chat ${message.sender === 'user' ? 'chat-end' : 'chat-start'} mb-4`}
        >
          <div className="chat-header">
            {message.sender === 'user' ? 'You' : 'LogosBot'}
          </div>
          <div 
            className={`chat-bubble ${
              message.sender === 'user' 
                ? 'chat-bubble-primary' /* DaisyUI primary color for user messages */
                : 'chat-bubble-secondary' /* DaisyUI secondary color for bot messages */
            }`}
          >
            {/* Render markdown for bot messages, plain text for user messages to improve readability */}
            {message.sender === 'bot' ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown 
                  components={{
                    // Custom styling for markdown elements to work better in chat bubbles
                    h2: ({children}) => <h2 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h2>,
                    h3: ({children}) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
                    ul: ({children}) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="ml-2">{children}</li>,
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({children}) => <strong className="font-bold text-white">{children}</strong>
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            ) : (
              message.text
            )}
          </div>
        </div>
      ))}
      
      {/* Empty div for scrolling to the end */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatBox; 