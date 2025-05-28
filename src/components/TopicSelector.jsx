import React from 'react';

// Predefined philosophical claims for quick selection
const predefinedTopics = [
  { id: 1, text: "Free will exists" },
  { id: 2, text: "Morality is subjective" },
  { id: 3, text: "Knowledge requires certainty" },
  { id: 4, text: "The mind is distinct from the body" }
];

// Optional debate styles
const debateStyles = [
  { id: 'socratic', name: "Socratic" },
  { id: 'formal', name: "Formal Logic" },
  { id: 'devil', name: "Devil's Advocate" }
];

// TopicSelector component for predefined debate topics
const TopicSelector = ({ 
  onTopicSelect, 
  onStyleSelect, 
  selectedStyle, 
  detectFallacies, 
  onFallacyToggle,
  // Adding steel-manning mode props
  steelManningMode,
  onSteelManningToggle
}) => {
  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Select a Topic:</h2>
        <div className="flex flex-wrap gap-2">
          {predefinedTopics.map(topic => (
            <button
              key={topic.id}
              onClick={() => onTopicSelect(topic.text)}
              className="btn btn-outline btn-sm"
            >
              {topic.text}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Debate Style:</h2>
        <div className="flex flex-wrap gap-2">
          {debateStyles.map(style => (
            <button
              key={style.id}
              onClick={() => onStyleSelect(style.id)}
              className={`btn btn-sm ${selectedStyle === style.id ? 'btn-active' : 'btn-outline'}`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      {/* Steel-Manning Mode Toggle - Added new feature */}
      <div className="mt-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">Steel-Manning Mode:</span>
          <div className="form-control">
            <label className="cursor-pointer label gap-2">
              <span className="label-text text-sm">
                {steelManningMode ? 'Enabled' : 'Disabled'}
              </span>
              <input 
                type="checkbox" 
                className="toggle toggle-sm toggle-primary"
                checked={steelManningMode}
                onChange={(e) => onSteelManningToggle(e.target.checked)}
              />
            </label>
          </div>
          <span className="text-xs opacity-70">
            {steelManningMode 
              ? "sophron-bot will help strengthen your argument before debating" 
              : "sophron-bot will debate your argument as-is"}
          </span>
        </div>
      </div>

      {/* Fallacy Detection Toggle */}
      <div className="mt-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">Fallacy Detection:</span>
          <div className="form-control">
            <label className="cursor-pointer label gap-2">
              <span className="label-text text-sm">
                {detectFallacies ? 'Enabled' : 'Disabled'}
              </span>
              <input 
                type="checkbox" 
                className="toggle toggle-sm"
                checked={detectFallacies}
                onChange={(e) => onFallacyToggle(e.target.checked)}
              />
            </label>
          </div>
          <span className="text-xs opacity-70">
            {detectFallacies 
              ? "sophron-bot will interrupt to identify logical fallacies in your arguments" 
              : "sophron-bot will not interrupt to point out logical fallacies"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopicSelector; 