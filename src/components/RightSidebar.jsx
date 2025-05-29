import React, { useState } from 'react';

// RightSidebar component now serves as both fallacy helper and steel manning assistant
const RightSidebar = ({ 
  detectFallacies = false,
  detectedFallacies = [],
  onClearFallacies = () => {},
  onAddTestFallacy = () => {},
  steelManningMode = false,
  steelManningSuggestions = [],
  onClearSteelManning = () => {}
}) => {
  // State for managing which fallacy is expanded for details
  const [expandedFallacy, setExpandedFallacy] = useState(null);
  // State for managing which steel manning suggestion is expanded
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  // Function to clear all detected fallacies
  const clearAllFallacies = () => {
    onClearFallacies();
    setExpandedFallacy(null); // Also clear any expanded fallacy
  };

  // Function to clear all steel manning suggestions
  const clearAllSuggestions = () => {
    onClearSteelManning();
    setExpandedSuggestion(null); // Also clear any expanded suggestion
  };

  // Toggle fallacy details
  const toggleFallacyDetails = (fallacyId) => {
    setExpandedFallacy(expandedFallacy === fallacyId ? null : fallacyId);
  };

  // Toggle suggestion details
  const toggleSuggestionDetails = (suggestionId) => {
    setExpandedSuggestion(expandedSuggestion === suggestionId ? null : suggestionId);
  };

  // Format timestamp for fallacy detection
  const formatTimestamp = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="w-64 bg-base-200 border-l border-base-300 h-full overflow-y-auto flex-shrink-0 p-6">
      {/* Sidebar Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Argument Assistant</h2>
        <p className="text-sm opacity-70">
          {(detectFallacies || steelManningMode) 
            ? "Analysis of your arguments will appear here"
            : "Enable features in the left sidebar to use this assistant"
          }
        </p>
      </div>

      {/* FALLACY DETECTION SECTION */}
      {detectFallacies && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <h3 className="text-lg font-medium">Fallacy Detection</h3>
          </div>
          
          {/* Fallacy Detection Status */}
          <div className={`p-3 rounded-lg border-2 mb-4 ${
            detectFallacies 
              ? detectedFallacies.length > 0 
                ? 'border-error bg-error/10 text-error' 
                : 'border-success bg-success/10 text-success'
              : 'border-base-300 bg-base-300/50'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                detectFallacies 
                  ? detectedFallacies.length > 0 
                    ? 'bg-error' 
                    : 'bg-success'
                  : 'bg-base-content/30'
              }`}></div>
              <span className="text-sm font-medium">
                {detectedFallacies.length > 0 
                  ? `${detectedFallacies.length} Fallac${detectedFallacies.length === 1 ? 'y' : 'ies'} Detected!`
                  : 'No Fallacies Detected'
                }
              </span>
            </div>
          </div>

          {/* No fallacies detected */}
          {detectedFallacies.length === 0 && (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 opacity-20">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
                </svg>
              </div>
              <h4 className="text-sm font-medium mb-2 opacity-70">Clean Arguments!</h4>
              <p className="text-xs opacity-50 leading-relaxed mb-3">
                Your arguments are logically sound.
              </p>
              
              {/* Test button */}
              <button
                onClick={() => onAddTestFallacy('Ad Hominem Test')}
                className="btn btn-outline btn-xs"
              >
                Test System
              </button>
            </div>
          )}

          {/* Detected fallacies list */}
          {detectedFallacies.length > 0 && (
            <>
              {/* Clear all button */}
              <div className="mb-4">
                <button
                  onClick={clearAllFallacies}
                  className="w-full btn btn-sm btn-ghost text-xs text-error hover:bg-error/10"
                >
                  Clear All ({detectedFallacies.length})
                </button>
              </div>

              {/* Fallacies list */}
              <div className="space-y-3">
                {detectedFallacies.map((fallacy) => {
                  const isExpanded = expandedFallacy === fallacy.id;

                  return (
                    <div key={fallacy.id} className="bg-error/10 border border-error/30 rounded-lg p-3 animate-in slide-in-from-right">
                      {/* Fallacy header */}
                      <button
                        onClick={() => toggleFallacyDetails(fallacy.id)}
                        className="w-full text-left flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm capitalize text-error">{fallacy.name}</h4>
                          <p className="text-xs opacity-60">{formatTimestamp(fallacy.detectedAt)}</p>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-error/20">
                          <div className="space-y-3">
                            {/* AI's explanation */}
                            <div>
                              <h5 className="font-medium text-xs mb-1">Why This Is a Fallacy:</h5>
                              <p className="text-xs opacity-80">{fallacy.explanation}</p>
                            </div>

                            {/* AI's improvement suggestion */}
                            <div>
                              <h5 className="font-medium text-xs mb-1">How to Improve:</h5>
                              <p className="text-xs opacity-80">{fallacy.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* STEEL MANNING SECTION */}
      {steelManningMode && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-info"></div>
            <h3 className="text-lg font-medium">Steel Manning</h3>
          </div>
          
          {/* Steel Manning Status */}
          <div className={`p-3 rounded-lg border-2 mb-4 ${
            steelManningSuggestions.length > 0 
              ? 'border-info bg-info/10 text-info' 
              : 'border-base-300 bg-base-300/50'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                steelManningSuggestions.length > 0 ? 'bg-info' : 'bg-base-content/30'
              }`}></div>
              <span className="text-sm font-medium">
                {steelManningSuggestions.length > 0 
                  ? `${steelManningSuggestions.length} Improvement${steelManningSuggestions.length === 1 ? '' : 's'} Suggested`
                  : 'No Improvements Suggested'
                }
              </span>
            </div>
          </div>

          {/* No suggestions */}
          {steelManningSuggestions.length === 0 && (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 opacity-20">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h4 className="text-sm font-medium mb-2 opacity-70">Strong Argument!</h4>
              <p className="text-xs opacity-50 leading-relaxed">
                Your argument appears to be well-constructed. Continue making your points!
              </p>
            </div>
          )}

          {/* Suggestions list */}
          {steelManningSuggestions.length > 0 && (
            <>
              {/* Clear all button */}
              <div className="mb-4">
                <button
                  onClick={clearAllSuggestions}
                  className="w-full btn btn-sm btn-ghost text-xs text-info hover:bg-info/10"
                >
                  Clear All ({steelManningSuggestions.length})
                </button>
              </div>

              {/* Suggestions list */}
              <div className="space-y-3">
                {steelManningSuggestions.map((suggestion) => {
                  const isExpanded = expandedSuggestion === suggestion.id;

                  return (
                    <div key={suggestion.id} className="bg-info/10 border border-info/30 rounded-lg p-3 animate-in slide-in-from-left">
                      {/* Suggestion header */}
                      <button
                        onClick={() => toggleSuggestionDetails(suggestion.id)}
                        className="w-full text-left flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-info">{suggestion.category}</h4>
                          <p className="text-xs opacity-60">{formatTimestamp(suggestion.detectedAt)}</p>
                        </div>
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-info/20">
                          <div className="space-y-3">
                            {/* AI's suggestion */}
                            <div>
                              <h5 className="font-medium text-xs mb-1">Suggestion:</h5>
                              <p className="text-xs opacity-80">{suggestion.suggestion}</p>
                            </div>

                            {/* AI's reasoning */}
                            <div>
                              <h5 className="font-medium text-xs mb-1">Why This Helps:</h5>
                              <p className="text-xs opacity-80">{suggestion.reason}</p>
                            </div>

                            {/* AI's example */}
                            {suggestion.example && (
                              <div>
                                <h5 className="font-medium text-xs mb-1">Example:</h5>
                                <p className="text-xs opacity-80 italic bg-info/5 p-2 rounded border-l-2 border-info/30">{suggestion.example}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* No features enabled state */}
      {!detectFallacies && !steelManningMode && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 mb-4 opacity-20">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/>
            </svg>
          </div>
          <h3 className="text-sm font-medium mb-2 opacity-70">Assistant Ready</h3>
          <p className="text-xs opacity-50 leading-relaxed">
            Enable Fallacy Detection or Steel-manning Mode in the left sidebar to get real-time analysis of your arguments.
          </p>
        </div>
      )}
    </div>
  );
};

export default RightSidebar; 