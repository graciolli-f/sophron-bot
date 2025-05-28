import React, { useState } from 'react';

// InputBar component for user prompts
const InputBar = ({ onSendMessage, isLoading }) => {
  // State for the input field
  const [inputValue, setInputValue] = useState('');

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Don't send empty messages
    if (inputValue.trim() === '') return;
    
    // Call the parent function to send the message
    onSendMessage(inputValue);
    
    // Clear the input field
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input 
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your philosophical claim here..."
        className="input input-bordered w-full text-white/80"
        disabled={isLoading}
      />
      <button 
        type="submit"
        className="btn btn-primary"
        disabled={isLoading || inputValue.trim() === ''}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          'Send'
        )}
      </button>
    </form>
  );
};

export default InputBar; 