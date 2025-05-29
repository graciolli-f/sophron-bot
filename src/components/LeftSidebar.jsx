import React, { useState } from 'react';

// LeftSidebar component for topic selection, debate styles, modes, and settings
const LeftSidebar = ({ 
  onTopicSelect, 
  onStyleSelect, 
  selectedStyle, 
  detectFallacies, 
  onFallacyToggle, 
  steelManningMode, 
  onSteelManningToggle,
  isDebateMode, 
  onDebateModeToggle 
}) => {
  // State for controlling topics section visibility
  const [isTopicsExpanded, setIsTopicsExpanded] = useState(false);

  // Predefined debate topics for quick selection
  const topics = [
    "Free will vs determinism",
    "The nature of consciousness", 
    "Moral relativism vs absolutism",
    "The meaning of life",
    "AI consciousness and rights",
    "Existence of objective truth",
    "The ethics of genetic engineering"
  ];

  // Available debate styles
  const debateStyles = [
    { id: 'socratic', name: 'Socratic Method', description: 'Question-based exploration' },
    { id: 'formal', name: 'Formal Logic', description: 'Structured logical reasoning' },
    { id: 'devil', name: "Devil's Advocate", description: 'Challenge all positions' }
  ];

  return (
    <div className="w-64 bg-base-200 border-r border-base-300 h-full overflow-y-auto flex-shrink-0 p-6">
      {/* Sidebar Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Debate Settings</h2>
        <p className="text-sm opacity-70">Configure your philosophical debate experience</p>
      </div>

      {/* Quick Topics Section */}
      <div className="mb-8">
        {/* Add state for toggling topics section visibility */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
        >
          <h3 className="text-lg font-medium">Quick Topics</h3>
          <button className="btn btn-ghost btn-sm">
            {isTopicsExpanded ? '▼' : '▶'}
          </button>
        </div>
        
        {/* Only show topics when expanded */}
        {isTopicsExpanded && (
          <div className="space-y-2 mt-4">
            {topics.map((topic, index) => (
              <button
                key={index}
                onClick={() => onTopicSelect(topic)}
                className="w-full text-left p-3 rounded-lg bg-base-300 hover:bg-base-100 transition-colors duration-150 text-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Debate Styles Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Debate Style</h3>
        <div className="space-y-3">
          {debateStyles.map((style) => (
            <div key={style.id}>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="debateStyle"
                  value={style.id}
                  checked={selectedStyle === style.id}
                  onChange={() => onStyleSelect(style.id)}
                  className="radio radio-primary radio-sm"
                />
                <div>
                  <div className="font-medium text-sm">{style.name}</div>
                  <div className="text-xs opacity-60">{style.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Modes Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Modes</h3>
        <div className="space-y-4">
          {/* Debate/Learn Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">
                {isDebateMode ? 'Debate Mode' : 'Learn Mode'}
              </div>
              <div className="text-xs opacity-60">
                {isDebateMode ? 'AI takes opposite position' : 'AI acts as educational partner'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={isDebateMode}
              onChange={(e) => onDebateModeToggle(e.target.checked)}
              className="toggle toggle-primary toggle-sm"
            />
          </div>

          {/* Fallacy Detection Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Fallacy Detection</div>
              <div className="text-xs opacity-60">Highlight logical fallacies</div>
            </div>
            <input
              type="checkbox"
              checked={detectFallacies}
              onChange={(e) => onFallacyToggle(e.target.checked)}
              className="toggle toggle-primary toggle-sm"
            />
          </div>

          {/* Steel-manning Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Steel-manning Mode</div>
              <div className="text-xs opacity-60">Strengthen arguments first</div>
            </div>
            <input
              type="checkbox"
              checked={steelManningMode}
              onChange={(e) => onSteelManningToggle(e.target.checked)}
              className="toggle toggle-primary toggle-sm"
            />
          </div>
        </div>
      </div>

      

      {/* Additional Settings Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Settings</h3>
        <div className="space-y-4">
          {/* Placeholder for future settings */}
          <div className="text-sm opacity-60">
            Additional settings will be added here as the application grows.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar; 