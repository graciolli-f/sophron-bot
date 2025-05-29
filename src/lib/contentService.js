// Content service for fetching philosophical information from various APIs
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Fetch content from Wikipedia API
export const fetchWikipediaContent = async (term) => {
  try {
    const response = await fetch(`${API_BASE}/api/wikipedia/${encodeURIComponent(term)}`);
    
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Don't log every 404 as an error - it's expected for many specialized terms
    if (!error.message.includes('404')) {
      console.error('Error fetching Wikipedia content:', error);
    }
    throw error;
  }
};

// Fetch content from Stanford Encyclopedia of Philosophy API
export const fetchSEPContent = async (term) => {
  try {
    const response = await fetch(`${API_BASE}/api/sep/${encodeURIComponent(term)}`);
    
    if (!response.ok) {
      throw new Error(`SEP API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Don't log every 404 as an error - it's expected for many specialized terms
    if (!error.message.includes('404')) {
      console.error('Error fetching SEP content:', error);
    }
    throw error;
  }
};

// Analyze chat messages to extract philosophical topics
export const analyzeChatContent = async (messages) => {
  try {
    const response = await fetch(`${API_BASE}/api/analyze-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    
    if (!response.ok) {
      throw new Error(`Chat analysis API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing chat content:', error);
    throw error;
  }
};

// Enhanced content fetcher that tries multiple sources with intelligent search strategies
export const fetchEnhancedContent = async (term, preferredSource = 'wikipedia') => {
  const sources = preferredSource === 'sep' ? ['sep', 'wikipedia'] : ['wikipedia', 'sep'];
  
  // Try alternative search terms for better results
  const searchVariations = generateSearchVariations(term);
  
  for (const source of sources) {
    for (const searchTerm of searchVariations) {
      try {
        if (source === 'wikipedia') {
          const result = await fetchWikipediaContent(searchTerm);
          // Only log successful searches with variations for debugging
          if (searchTerm !== term) {
            console.info(`Found content for "${term}" using variation "${searchTerm}"`);
          }
          return { ...result, originalTerm: term }; // Include original term for reference
        } else if (source === 'sep') {
          const result = await fetchSEPContent(searchTerm);
          if (searchTerm !== term) {
            console.info(`Found content for "${term}" using variation "${searchTerm}"`);
          }
          return { ...result, originalTerm: term };
        }
      } catch (error) {
        // Only log for the original term and only if it's not a 404
        if (searchTerm === term && !error.message.includes('404')) {
          console.warn(`Error fetching from ${source} for "${term}":`, error.message);
        }
        // Continue to next variation/source
      }
    }
  }
  
  // If all sources and variations fail, return a basic fallback entry
  // Only log this at debug level since it's expected for specialized terms
  return createFallbackContent(term);
};

// Generate search variations for better API results
const generateSearchVariations = (term) => {
  const variations = [term]; // Start with original term
  
  // Clean up the term
  const cleanTerm = term.toLowerCase().trim();
  
  // For theological/religious terms, try broader concepts
  if (cleanTerm.includes('god') || cleanTerm.includes('divine') || cleanTerm.includes('holy')) {
    if (cleanTerm.includes('all-loving') || cleanTerm.includes('loving')) {
      variations.push('God', 'Attributes of God', 'Omnibenevolence');
    }
    if (cleanTerm.includes('old testament')) {
      variations.push('God in the Hebrew Bible', 'YHWH', 'Theology');
    }
    if (cleanTerm.includes('wrath') || cleanTerm.includes('anger')) {
      variations.push('Divine command theory', 'Problem of evil', 'Theodicy');
    }
  }
  
  // For hyphenated terms, try without hyphens and spaces
  if (term.includes('-')) {
    variations.push(term.replace(/-/g, ' '));
    variations.push(term.replace(/-/g, ''));
  }
  
  // For compound philosophical terms, try the root concept
  if (cleanTerm.includes('theodicy')) {
    variations.push('Theodicy', 'Problem of evil');
  }
  
  // For philosophical schools ending in -ism, try without -ism
  if (cleanTerm.endsWith('ism')) {
    const root = cleanTerm.slice(0, -3);
    variations.push(root);
  }
  
  // For spaces, try without spaces for SEP compatibility
  if (term.includes(' ')) {
    variations.push(term.replace(/\s+/g, ''));
  }
  
  // Remove duplicates and empty strings
  return [...new Set(variations)].filter(v => v.trim().length > 0);
};

// Create enhanced fallback content with better recommendations
const createFallbackContent = (term) => {
  // Create more contextual fallback content based on term type
  let definition = `A philosophical concept or term discussed in the conversation.`;
  let relatedPhilosophers = [];
  let furtherReading = [];
  let relatedConcepts = [];
  
  // Enhance fallback based on term characteristics
  const lowerTerm = term.toLowerCase();
  
  if (lowerTerm.includes('god') || lowerTerm.includes('divine')) {
    definition = `A theological concept related to the nature, attributes, or actions of the divine. This term was discussed in the context of philosophical theology.`;
    relatedPhilosophers = ['Aquinas', 'Augustine', 'Anselm', 'Maimonides'];
    furtherReading = [
      'Stanford Encyclopedia: Philosophy of Religion',
      'Routledge Companion to Philosophy of Religion',
      'The Cambridge Companion to Religious Studies'
    ];
    relatedConcepts = ['Theodicy', 'Divine Attributes', 'Problem of Evil', 'Natural Theology'];
  } else if (lowerTerm.includes('theodicy')) {
    definition = `A concept in philosophical theology that addresses the problem of evil and suffering in relation to divine goodness and omnipotence.`;
    relatedPhilosophers = ['Leibniz', 'Augustine', 'Hick', 'Plantinga'];
    furtherReading = [
      'Leibniz: Theodicy',
      'John Hick: Evil and the God of Love',
      'Alvin Plantinga: God, Freedom, and Evil'
    ];
    relatedConcepts = ['Problem of Evil', 'Divine Attributes', 'Free Will Defense'];
  } else if (lowerTerm.includes('fallacy')) {
    definition = `A logical fallacy or reasoning error that was identified in the philosophical discussion.`;
    relatedPhilosophers = ['Aristotle', 'Mill', 'Peirce', 'Toulmin'];
    furtherReading = [
      'Aristotle: Sophistical Refutations',
      'Mill: System of Logic',
      'Toulmin: The Uses of Argument'
    ];
    relatedConcepts = ['Logic', 'Critical Thinking', 'Argumentation', 'Rhetoric'];
  } else if (lowerTerm.includes('ethic') || lowerTerm.includes('moral')) {
    definition = `An ethical concept or principle discussed in the context of moral philosophy.`;
    relatedPhilosophers = ['Aristotle', 'Kant', 'Mill', 'Rawls'];
    furtherReading = [
      'Aristotle: Nicomachean Ethics',
      'Kant: Groundwork for the Metaphysics of Morals',
      'Mill: Utilitarianism'
    ];
    relatedConcepts = ['Virtue Ethics', 'Deontology', 'Consequentialism', 'Moral Responsibility'];
  } else if (lowerTerm.includes('consciousness') || lowerTerm.includes('mind')) {
    definition = `A concept in philosophy of mind concerning the nature of consciousness, mental states, or cognitive processes.`;
    relatedPhilosophers = ['Descartes', 'Chalmers', 'Dennett', 'Nagel'];
    furtherReading = [
      'Chalmers: The Conscious Mind',
      'Dennett: Consciousness Explained',
      'Nagel: What Is It Like to Be a Bat?'
    ];
    relatedConcepts = ['Hard Problem of Consciousness', 'Qualia', 'Mind-Body Problem', 'Intentionality'];
  } else {
    // General philosophical term
    relatedPhilosophers = ['Plato', 'Aristotle', 'Kant', 'Wittgenstein'];
    furtherReading = [
      'Stanford Encyclopedia of Philosophy',
      'Internet Encyclopedia of Philosophy',
      'Routledge Encyclopedia of Philosophy'
    ];
    relatedConcepts = ['Philosophy', 'Critical Thinking', 'Logic', 'Argumentation'];
  }
  
  return {
    title: term,
    definition,
    relatedPhilosophers,
    furtherReading,
    relatedConcepts,
    source: 'fallback',
    url: null,
    originalTerm: term
  };
};

// Process analysis results and fetch detailed content for each item
export const enrichAnalysisWithContent = async (analysisResult) => {
  const enrichedData = {
    recentlyDiscussed: [],
    philosophicalConcepts: {},
    philosophers: {},
    philosophicalSchools: {},
    logicalFallacies: {}
  };
  
  try {
    // Process concepts with improved error handling
    for (const concept of analysisResult.concepts || []) {
      try {
        const content = await fetchEnhancedContent(concept.name);
        enrichedData.philosophicalConcepts[concept.id] = {
          title: content.title,
          definition: content.definition,
          relatedConcepts: content.relatedConcepts || [],
          relatedPhilosophers: content.relatedPhilosophers || extractRelatedPhilosophers(content.definition),
          furtherReading: content.furtherReading || generateFurtherReading(content.title, 'concept'),
          source: content.source,
          url: content.url,
          originalTerm: content.originalTerm
        };
        
        // Add to recently discussed
        enrichedData.recentlyDiscussed.push({
          id: concept.id,
          name: concept.name,
          type: 'concept',
          mentions: concept.mentions
        });
      } catch (error) {
        console.warn(`Failed to enrich concept "${concept.name}":`, error.message);
        // Add fallback entry even if enrichment fails
        const fallbackContent = createFallbackContent(concept.name);
        enrichedData.philosophicalConcepts[concept.id] = {
          title: fallbackContent.title,
          definition: fallbackContent.definition,
          relatedConcepts: fallbackContent.relatedConcepts,
          relatedPhilosophers: fallbackContent.relatedPhilosophers,
          furtherReading: fallbackContent.furtherReading,
          source: fallbackContent.source,
          url: fallbackContent.url,
          originalTerm: fallbackContent.originalTerm
        };
        
        // Still add to recently discussed
        enrichedData.recentlyDiscussed.push({
          id: concept.id,
          name: concept.name,
          type: 'concept',
          mentions: concept.mentions
        });
      }
    }
    
    // Process philosophers with improved error handling
    for (const philosopher of analysisResult.philosophers || []) {
      try {
        const content = await fetchEnhancedContent(philosopher.name, 'sep'); // Prefer SEP for philosophers
        enrichedData.philosophers[philosopher.id] = {
          name: content.title,
          period: extractPeriodFromDefinition(content.definition),
          summary: content.definition,
          keyIdeas: extractKeyIdeas(content.definition),
          relevantWorks: content.relatedConcepts || extractWorks(content.definition),
          furtherReading: content.furtherReading || generateFurtherReading(content.title, 'philosopher'),
          source: content.source,
          url: content.url,
          originalTerm: content.originalTerm
        };
        
        // Add to recently discussed
        enrichedData.recentlyDiscussed.push({
          id: philosopher.id,
          name: philosopher.name,
          type: 'philosopher',
          mentions: philosopher.mentions
        });
      } catch (error) {
        console.warn(`Failed to enrich philosopher "${philosopher.name}":`, error.message);
        // Add fallback entry even if enrichment fails
        enrichedData.philosophers[philosopher.id] = {
          name: philosopher.name,
          period: 'Unknown',
          summary: `A philosopher mentioned in the discussion.`,
          keyIdeas: ['Mentioned in current conversation'],
          relevantWorks: [],
          furtherReading: generateFurtherReading(philosopher.name, 'philosopher'),
          source: 'chat',
          url: null,
          originalTerm: philosopher.name
        };
        
        // Still add to recently discussed
        enrichedData.recentlyDiscussed.push({
          id: philosopher.id,
          name: philosopher.name,
          type: 'philosopher',
          mentions: philosopher.mentions
        });
      }
    }
    
    // Process schools with improved error handling
    for (const school of analysisResult.schools || []) {
      try {
        const content = await fetchEnhancedContent(school.name, 'sep');
        enrichedData.philosophicalSchools[school.id] = {
          name: content.title,
          summary: content.definition,
          keyPrinciples: extractKeyPrinciples(content.definition),
          notableFigures: content.relatedConcepts || extractNotableFigures(content.definition),
          furtherReading: content.furtherReading || generateFurtherReading(content.title, 'school'),
          source: content.source,
          url: content.url,
          originalTerm: content.originalTerm
        };
        
        // Add to recently discussed
        enrichedData.recentlyDiscussed.push({
          id: school.id,
          name: school.name,
          type: 'school',
          mentions: school.mentions
        });
      } catch (error) {
        console.warn(`Failed to enrich school "${school.name}":`, error.message);
        // Add fallback entry even if enrichment fails
        enrichedData.philosophicalSchools[school.id] = {
          name: school.name,
          summary: `A philosophical school or tradition mentioned in the discussion.`,
          keyPrinciples: ['Discussed in current conversation'],
          notableFigures: [],
          furtherReading: generateFurtherReading(school.name, 'school'),
          source: 'chat',
          url: null,
          originalTerm: school.name
        };
        
        // Still add to recently discussed
        enrichedData.recentlyDiscussed.push({
          id: school.id,
          name: school.name,
          type: 'school',
          mentions: school.mentions
        });
      }
    }
    
    // Process fallacies (these typically won't have Wikipedia/SEP entries, so we'll use basic definitions)
    for (const fallacy of analysisResult.fallacies || []) {
      enrichedData.logicalFallacies[fallacy.id] = {
        name: fallacy.name,
        definition: `A logical fallacy identified in the discussion.`,
        examples: [`Used in the context of the current debate.`],
        howToAvoid: `Be aware of this reasoning error when making arguments.`,
        furtherReading: [
          'Aristotle: Sophistical Refutations',
          'Walton: Informal Logic',
          'van Eemeren: Argumentation Theory'
        ],
        source: 'chat'
      };
      
      // Add to recently discussed
      enrichedData.recentlyDiscussed.push({
        id: fallacy.id,
        name: fallacy.name,
        type: 'fallacy',
        mentions: fallacy.mentions
      });
    }
    
    // Sort recently discussed by mentions (descending)
    enrichedData.recentlyDiscussed.sort((a, b) => b.mentions - a.mentions);
    
  } catch (error) {
    console.error('Error enriching analysis with content:', error);
  }
  
  return enrichedData;
};

// Helper functions for extracting information from content

const extractRelatedPhilosophers = (text) => {
  if (!text) return [];
  
  const commonPhilosophers = [
    'Aristotle', 'Plato', 'Socrates', 'Kant', 'Hume', 'Descartes', 'Nietzsche',
    'Mill', 'Bentham', 'Hegel', 'Spinoza', 'Locke', 'Hobbes', 'Rousseau',
    'Kierkegaard', 'Sartre', 'Camus', 'Wittgenstein', 'Russell', 'Aquinas',
    'Augustine', 'Confucius', 'Lao Tzu', 'Marcus Aurelius', 'Epictetus'
  ];
  
  return commonPhilosophers.filter(philosopher => 
    text.toLowerCase().includes(philosopher.toLowerCase())
  ).slice(0, 4);
};

const extractKeyIdeas = (text) => {
  if (!text) return [];
  
  // Extract key concepts from philosophical text
  const sentences = text.split('.').slice(0, 3);
  return sentences
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 20 && sentence.length < 100)
    .slice(0, 3);
};

const extractKeyPrinciples = (text) => {
  return extractKeyIdeas(text); // Same logic for now
};

const extractWorks = (text) => {
  // Look for common work patterns in text
  const workPatterns = [
    /["'](.*?)["']/g, // Quoted titles
    /\b[A-Z][a-zA-Z\s]+Ethics?\b/g, // Ethics works
    /\b[A-Z][a-zA-Z\s]+Critique?\b/g, // Critique works
  ];
  
  const works = [];
  for (const pattern of workPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      works.push(...matches.slice(0, 3));
    }
  }
  
  return works.slice(0, 4);
};

const extractNotableFigures = (text) => {
  return extractRelatedPhilosophers(text); // Same logic
};

const generateFurtherReading = (term, type) => {
  const baseRecommendations = [
    `Stanford Encyclopedia of Philosophy: ${term}`,
    `Internet Encyclopedia of Philosophy: ${term}`,
    `Routledge Companion to ${type === 'philosopher' ? 'Philosophy' : 'Philosophy'}`
  ];
  
  // Add type-specific recommendations
  if (type === 'philosopher') {
    baseRecommendations.push(`Primary texts by ${term}`);
    baseRecommendations.push(`Biographical studies of ${term}`);
  } else if (type === 'concept') {
    baseRecommendations.push(`Recent discussions on ${term}`);
    baseRecommendations.push(`Historical development of ${term}`);
  } else if (type === 'school') {
    baseRecommendations.push(`Key texts in ${term}`);
    baseRecommendations.push(`Contemporary interpretations of ${term}`);
  }
  
  return baseRecommendations.slice(0, 4);
};

// Helper function to extract time period from philosophical content
const extractPeriodFromDefinition = (definition) => {
  if (!definition) return 'Unknown';
  
  // Look for common period patterns
  const periodPatterns = [
    /(\d{3,4}[–-]\d{3,4})/,  // e.g., "1724-1804"
    /(\d{3,4}\s*[–-]\s*\d{3,4})/,  // e.g., "1724 - 1804"
    /(\d{3,4}[–-]present)/i,  // e.g., "1935-present"
    /(c\.\s*\d{3,4}[–-]\d{3,4})/i,  // e.g., "c. 470-399 BCE"
    /(\d{3,4}\s*BCE[–-]\d{3,4}\s*CE)/i,  // e.g., "384 BCE-322 CE"
  ];
  
  for (const pattern of periodPatterns) {
    const match = definition.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return 'Unknown';
}; 