import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

// ChatBox component to display messages between user and bot
const ChatBox = ({ messages, onTermClick }) => {
  // Reference to the message container for auto-scrolling
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Common philosophical terms that should be clickable
  const philosophicalTerms = [
    // Concepts
    'free will', 'determinism', 'consciousness', 'qualia', 'moral responsibility', 
    'theodicy', 'soul-making theodicy', 'utilitarianism', 'deontology', 'virtue ethics',
    'existentialism', 'phenomenology', 'empiricism', 'rationalism', 'materialism',
    'dualism', 'monism', 'nihilism', 'absurdism', 'pragmatism', 'stoicism',
    'epistemology', 'metaphysics', 'ontology', 'ethics', 'aesthetics', 'logic',
    'skepticism', 'relativism', 'absolutism', 'naturalism', 'supernaturalism',
    
    // Philosophers
    'aristotle', 'plato', 'socrates', 'kant', 'hume', 'descartes', 'nietzsche',
    'mill', 'bentham', 'hegel', 'spinoza', 'locke', 'hobbes', 'rousseau',
    'kierkegaard', 'sartre', 'camus', 'beauvoir', 'wittgenstein', 'russell',
    'aquinas', 'augustine', 'confucius', 'buddha', 'lao tzu', 'marcus aurelius',
    'epictetus', 'seneca', 'epicurus', 'diogenes', 'parmenides', 'heraclitus',
    'john hick', 'david hume', 'john stuart mill', 'friedrich nietzsche',
    
    // Schools and movements
    'stoicism', 'epicureanism', 'cynicism', 'platonism', 'aristotelianism',
    'thomism', 'nominalism', 'realism', 'idealism', 'positivism', 'postmodernism',
    'existentialism', 'phenomenology', 'analytic philosophy', 'continental philosophy',
    
    // Logical fallacies
    'ad hominem', 'straw man', 'false dilemma', 'slippery slope', 'appeal to authority',
    'appeal to emotion', 'circular reasoning', 'hasty generalization', 'red herring',
    'tu quoque', 'bandwagon fallacy', 'false cause', 'appeal to ignorance'
  ];

  // Custom component to handle clickable terms within markdown
  const ClickableText = ({ children }) => {
    if (!onTermClick || typeof children !== 'string') {
      return children;
    }

    // Create a case-insensitive regex pattern for philosophical terms
    const termPattern = new RegExp(
      `\\b(${philosophicalTerms.map(term => 
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex characters
      ).join('|')})\\b`,
      'gi'
    );

    const parts = [];
    let lastIndex = 0;
    let match;

    // Find all matches of philosophical terms
    while ((match = termPattern.exec(children)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(children.slice(lastIndex, match.index));
      }

      // Add the clickable term
      const term = match[0];
      
      // Create a search URL for the term - prioritize Stanford Encyclopedia of Philosophy
      const searchUrl = `https://plato.stanford.edu/search/search?query=${encodeURIComponent(term)}`;
      
      parts.push(
        <a
          key={`${match.index}-${term}`}
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary-focus underline underline-offset-2 hover:bg-primary/10 rounded px-1 transition-colors duration-150 cursor-pointer"
          title={`Search for ${term} on Stanford Encyclopedia of Philosophy`}
        >
          {term}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last match
    if (lastIndex < children.length) {
      parts.push(children.slice(lastIndex));
    }

    // Reset regex lastIndex for next use
    termPattern.lastIndex = 0;

    return parts.length > 1 ? <>{parts}</> : children;
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-primary text-primary-content'
                : 'bg-base-300 text-base-content'
            } ${message.isLoading ? 'animate-pulse' : ''}`}
          >
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
                    p: ({children}) => <p className="mb-2 last:mb-0"><ClickableText>{children}</ClickableText></p>,
                    strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                    // Handle text nodes at the root level
                    text: ({children}) => <ClickableText>{children}</ClickableText>
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