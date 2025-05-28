import React, { useState } from 'react';

// RightSidebar component for contextual information and reference material
const RightSidebar = () => {
  // State for selected context topic
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Sample contextual information - in a real app, this could be fetched dynamically
  const contextualInfo = {
    'free-will': {
      title: 'Free Will',
      definition: 'The ability to make choices that are genuinely your own, not predetermined by prior causes.',
      keyPoints: [
        'Hard determinism argues free will is an illusion',
        'Libertarian free will suggests genuine choice exists',
        'Compatibilism tries to reconcile free will with determinism'
      ],
      relatedConcepts: ['Determinism', 'Moral Responsibility', 'Causation']
    },
    'determinism': {
      title: 'Determinism',
      definition: 'The doctrine that all events, including human choices, are the inevitable result of prior causes.',
      keyPoints: [
        'Physical determinism: all events follow natural laws',
        'Causal determinism: every event has a sufficient cause',
        'Implications for moral responsibility and punishment'
      ],
      relatedConcepts: ['Free Will', 'Causation', 'Predictability']
    },
    'consciousness': {
      title: 'Consciousness',
      definition: 'The state of being aware of and able to think about one\'s existence, sensations, thoughts, and surroundings.',
      keyPoints: [
        'Hard problem: explaining subjective experience',
        'Different theories: materialism, dualism, panpsychism',
        'Questions about AI consciousness and qualia'
      ],
      relatedConcepts: ['Qualia', 'Mind-Body Problem', 'Artificial Intelligence']
    }
  };

  // Recently discussed topics (could be populated from chat analysis)
  const recentTopics = [
    { id: 'free-will', name: 'Free Will', mentions: 3 },
    { id: 'determinism', name: 'Determinism', mentions: 5 },
    { id: 'consciousness', name: 'Consciousness', mentions: 1 }
  ];

  // Handle clicking on a topic for more details
  const handleTopicClick = (topicId) => {
    setSelectedTopic(topicId);
  };

  return (
    <div className="w-64 bg-base-200 border-l border-base-300 h-screen overflow-y-auto p-6">
      {/* Sidebar Header */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Context & References</h2>
        <p className="text-sm opacity-70">Explore concepts mentioned in your debate</p>
      </div>

      {/* Recently Mentioned Topics */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Recent Topics</h3>
        {recentTopics.length > 0 ? (
          <div className="space-y-2">
            {recentTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className="w-full text-left p-3 rounded-lg bg-base-300 hover:bg-base-100 transition-colors duration-150"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{topic.name}</span>
                  <span className="text-xs opacity-60">{topic.mentions}x</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm opacity-60 p-3 bg-base-300 rounded-lg">
            Topics will appear here as you discuss them in your debate.
          </div>
        )}
      </div>

      {/* Selected Topic Details */}
      {selectedTopic && contextualInfo[selectedTopic] && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Topic Details</h3>
            <button
              onClick={() => setSelectedTopic(null)}
              className="btn btn-ghost btn-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="bg-base-300 rounded-lg p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-base mb-2">
                {contextualInfo[selectedTopic].title}
              </h4>
              <p className="text-sm opacity-80 leading-relaxed">
                {contextualInfo[selectedTopic].definition}
              </p>
            </div>

            <div>
              <h5 className="font-medium text-sm mb-2">Key Points:</h5>
              <ul className="space-y-1">
                {contextualInfo[selectedTopic].keyPoints.map((point, index) => (
                  <li key={index} className="text-xs opacity-70 ml-3">
                    • {point}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-sm mb-2">Related Concepts:</h5>
              <div className="flex flex-wrap gap-1">
                {contextualInfo[selectedTopic].relatedConcepts.map((concept, index) => (
                  <span
                    key={index}
                    className="badge badge-ghost badge-sm cursor-pointer hover:badge-primary"
                    onClick={() => {
                      const conceptId = concept.toLowerCase().replace(/\s+/g, '-');
                      if (contextualInfo[conceptId]) {
                        setSelectedTopic(conceptId);
                      }
                    }}
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reference Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Quick Reference</h3>
        <div className="space-y-3">
          <div className="bg-base-300 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-1">Logical Fallacies</h4>
            <p className="text-xs opacity-60">Common reasoning errors to avoid</p>
          </div>
          
          <div className="bg-base-300 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-1">Argument Structure</h4>
            <p className="text-xs opacity-60">How to build strong arguments</p>
          </div>
          
          <div className="bg-base-300 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-1">Philosophical Schools</h4>
            <p className="text-xs opacity-60">Major philosophical traditions</p>
          </div>
        </div>
      </div>

      {/* Debug Information (can be removed in production) */}
      <div className="mt-auto pt-4 border-t border-base-300">
        <div className="text-xs opacity-50">
          <p>Context sidebar ready</p>
          <p>Click topics to explore concepts</p>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar; 