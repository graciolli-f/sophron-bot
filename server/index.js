import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client conditionally - only if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn('⚠️  OPENAI_API_KEY not found. Server will start but chat functionality will be limited.');
  console.warn('📝 Please create a .env file with your OpenAI API key to enable full functionality.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Base system prompt for the bot
const BASE_SYSTEM_PROMPT = `You are a philosophical debate bot named sophron-bot. You must respond with logically sound arguments, debate with the user in a structured manner, and always in good faith. Your main purpose is to help the user understand their own arguments and improve them. Your role is educational, not argumentative. You hold no personal opinions, and you are not biased towards any particular philosophical position. You are a neutral party who is only interested in helping the user understand their own arguments and improve them by using debate techniques, logical reasoning, and critical thinking.

Your goals:

    Respond directly to the user's claim 

    Reference major philosophical positions when relevant

    If the user's claim is vague, explain the vagueness and why it weakens their argument and ask clarifying questions to help them understand their own argument better.

    Avoid logical fallacies at all costs.

    Conclude a debate if the user's claim is internally inconsistent or you both reach agreement.

Do not use filler or fluff. Be precise, firm, and fair. 

If the user's claim is not a philosophical you should respond with "I'm sorry, I can only help with philosophical arguments." The definition of philosophical argument can be broadly interpreted, and can include ethics, religion, personal opinions, and other types of positions that could be argued. 

Keep your responses short and concise (< 75 words). Don't provide more information than is necessary. `;

// Steel-manning mode system prompt for strengthening phase
const STEEL_MANNING_PROMPT = `You are sophron-bot in Steel-Manning Mode. Your role is to help strengthen the user's argument BEFORE debating it. 

Format your response with clear structure using markdown formatting for better readability:
- Use **bold** for emphasis on key terms
- Use headings (##) to organize sections
- Use bullet points (-) for lists
- Use numbered lists (1.) for sequential items

Analyze their claim for:
1. **Weak points**: Identify vague language, overgeneralizations, or unclear terms
2. **Missing premises**: Point out unstated assumptions that need to be made explicit  
3. **Scope issues**: Suggest more precise boundaries or qualifications
4. **Evidence gaps**: Recommend specific types of supporting evidence needed

Structure your response as follows:

## Analysis of Your Claim
[Brief acknowledgment of their argument]

## Identified Weaknesses
- **[Weakness type]**: [Specific issue and explanation]
- **[Weakness type]**: [Specific issue and explanation]
- **[Weakness type]**: [Specific issue and explanation]

## Stronger Formulation
"[Improved claim with greater specificity and precision]"

## Supporting Evidence to Consider
1. [Specific type of evidence or research]
2. [Specific type of evidence or research]
3. [Specific type of evidence or research]

## Next Steps
Ready to debate this stronger version of your argument? 

Keep your analysis concise but thorough. Your goal is to make their argument as strong as possible before you challenge it.`;

// Additional prompt text for fallacy detection
const FALLACY_DETECTION_PROMPT = `
You must actively identify logical fallacies in the user's arguments. When you detect a logical fallacy:

1. IMMEDIATELY interrupt the conversation and explicitly point out the fallacy
2. Name the specific fallacy (e.g., ad hominem, straw man, appeal to authority)
3. Explain why the argument contains this fallacy
4. Ask the user to reformulate their argument without the fallacy

Be vigilant and do not let fallacious reasoning pass unchallenged. This is a critical part of your role as a debate partner.
`;

// Debate mode system prompt - AI takes opposite position automatically
const DEBATE_MODE_PROMPT = `You are sophron-bot in Debate Mode. Your role is to automatically take the opposite position to whatever the user argues, engaging in genuine adversarial debate.

Your approach:

1. **Identify the user's position**: Clearly understand what they are arguing for
2. **Take the opposite stance**: Automatically argue against their position, regardless of your personal views
3. **Argue in good faith**: Present genuine counterarguments, not strawmen
4. **Use solid reasoning**: Support your opposing position with logical arguments, evidence, and philosophical precedent
5. **Be adversarial but respectful**: Challenge them firmly but maintain philosophical decorum
6. **Reference opposing viewpoints**: Cite philosophers, schools of thought, or arguments that support your contrary position

Your goal is to provide genuine intellectual opposition to help them strengthen their reasoning through real debate. You are their opponent in this debate, not their teacher.

Keep responses sharp and focused (< 100 words). Challenge their premises, question their logic, and present compelling counterarguments.`;

// API endpoint for chat completions
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, detectFallacies = false, steelManningMode = false, isStrengtheningPhase = false, selectedStyle = '', isDebateMode = false } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Check if OpenAI client is configured
    if (!openai) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file and restart the server.' 
      });
    }

    // Build style-specific prompt additions
    let stylePrompt = '';
    if (selectedStyle === 'socratic') {
      stylePrompt = '\n\nYou must use the Socratic method: ask probing questions to guide the user to deeper understanding rather than making direct statements. Challenge them through thoughtful questions that expose assumptions and lead them to examine their beliefs more carefully.';
    } else if (selectedStyle === 'formal') {
      stylePrompt = '\n\nYou must use formal logic structures: Begin responses with "Premise 1:", "Premise 2:", etc., followed by "Conclusion:". Use logical connectives (if-then, and, or, not, therefore). Identify the logical structure of their argument explicitly. Use terms like "valid/invalid", "sound/unsound", "logical form", and cite specific logical principles when applicable.';
    } else if (selectedStyle === 'devil') {
      stylePrompt = '\n\nYou must take the devil\'s advocate position: challenge the user\'s claims regardless of your own position, find weaknesses in their arguments, present counterarguments, and push them to defend their position more rigorously. Debate the user directly, do not make passive arguments for why others might not agree';
    }

    // Determine which system prompt to use based on mode and phase
    let systemPrompt;
    if (steelManningMode && isStrengtheningPhase) {
      // In steel-manning strengthening phase: help improve the argument
      systemPrompt = STEEL_MANNING_PROMPT + stylePrompt; // Added style-specific instructions to steel-manning mode
    } else if (isDebateMode) {
      // Debate mode: use debate mode prompt with style
      systemPrompt = DEBATE_MODE_PROMPT + stylePrompt;
    } else {
      // Normal debate mode: use base prompt with style
      systemPrompt = BASE_SYSTEM_PROMPT;
      systemPrompt += stylePrompt; // Added style-specific instructions to all debate responses
    }

    // Format messages for OpenAI API
    const formattedMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    ];

    // Make OpenAI API call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000
    });

    // Return the response
    res.json({ 
      message: response.choices[0].message.content 
    });

  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    
    // Return appropriate error response based on error type
    if (error.status === 401) {
      res.status(401).json({ error: 'Invalid OpenAI API key' });
    } else if (error.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else if (error.status === 400) {
      res.status(400).json({ error: 'Bad request to OpenAI API' });
    } else {
      res.status(500).json({ error: 'Failed to get response from AI. Please try again.' });
    }
  }
});

// New API endpoint for fetching Wikipedia content
app.get('/api/wikipedia/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const encodedTerm = encodeURIComponent(term);
    
    // Fetch Wikipedia summary
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTerm}`;
    const summaryResponse = await fetch(summaryUrl);
    
    if (!summaryResponse.ok) {
      return res.status(404).json({ error: 'Wikipedia article not found' });
    }
    
    const summaryData = await summaryResponse.json();
    
    // Fetch related links
    const linksUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=links&titles=${encodedTerm}&pllimit=10`;
    const linksResponse = await fetch(linksUrl);
    const linksData = await linksResponse.json();
    
    // Extract related concepts from links
    let relatedConcepts = [];
    if (linksData.query && linksData.query.pages) {
      const pages = Object.values(linksData.query.pages);
      if (pages[0] && pages[0].links) {
        relatedConcepts = pages[0].links.map(link => link.title).slice(0, 5);
      }
    }
    
    // Format response for frontend consumption
    const formattedData = {
      title: summaryData.title,
      definition: summaryData.extract,
      url: summaryData.content_urls?.desktop?.page,
      thumbnail: summaryData.thumbnail?.source,
      relatedConcepts: relatedConcepts,
      source: 'wikipedia',
      keyPoints: summaryData.extract ? [
        summaryData.extract.split('.')[0] + '.',
        summaryData.extract.split('.')[1] ? summaryData.extract.split('.')[1] + '.' : ''
      ].filter(point => point.length > 10) : []
    };
    
    res.json(formattedData);
    
  } catch (error) {
    console.error('❌ Error fetching Wikipedia content:', error);
    res.status(500).json({ error: 'Failed to fetch Wikipedia content' });
  }
});

// New API endpoint for fetching Stanford Encyclopedia of Philosophy content
app.get('/api/sep/:term', async (req, res) => {
  try {
    const { term } = req.params;
    
    // Clean and format the term for SEP URLs
    // SEP URLs use different patterns for different types of entries
    const cleanTerm = term.toLowerCase()
      .replace(/\s+/g, '')  // Remove all spaces
      .replace(/-/g, '')    // Remove hyphens
      .replace(/[^a-z0-9]/g, ''); // Remove special characters
    
    // Try multiple URL patterns that SEP uses
    const urlVariations = [
      // Standard hyphenated format (most common)
      `https://plato.stanford.edu/entries/${term.toLowerCase().replace(/\s+/g, '-')}/`,
      // No spaces, no hyphens (for single concepts)
      `https://plato.stanford.edu/entries/${cleanTerm}/`,
      // Alternative patterns for philosopher names
      `https://plato.stanford.edu/entries/${term.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')}/`,
      // For multi-word names, try lastname-firstname pattern
      ...(term.includes(' ') ? [
        `https://plato.stanford.edu/entries/${term.toLowerCase().split(' ').reverse().join('-')}/`,
        `https://plato.stanford.edu/entries/${term.toLowerCase().split(' ').pop()}/`, // Just last name
        `https://plato.stanford.edu/entries/${term.toLowerCase().replace(/\s+/g, '')}/`
      ] : []),
      // Special cases for known philosopher patterns
      ...(term.toLowerCase().includes('mill') ? [
        'https://plato.stanford.edu/entries/mill/',
        'https://plato.stanford.edu/entries/mill-moral-political/'
      ] : []),
      ...(term.toLowerCase().includes('nietzsche') ? [
        'https://plato.stanford.edu/entries/nietzsche/',
        'https://plato.stanford.edu/entries/nietzsche-moral-political/'
      ] : []),
      ...(term.toLowerCase().includes('hick') ? [
        'https://plato.stanford.edu/entries/hick-theology/'
      ] : [])
    ];
    
    let response = null;
    let htmlContent = null;
    let usedUrl = null;
    
    // Try each URL variation
    for (const url of urlVariations) {
      try {
        response = await fetch(url);
        if (response.ok) {
          htmlContent = await response.text();
          usedUrl = url;
          break;
        }
      } catch (error) {
        continue; // Try next variation
      }
    }
    
    if (!response || !response.ok || !htmlContent) {
      return res.status(404).json({ error: 'SEP article not found' });
    }
    
    // Improved HTML parsing to extract key information
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' (Stanford Encyclopedia of Philosophy)', '') : term;
    
    // Extract the preamble/introduction which contains the main definition
    let definition = '';
    const preambleMatch = htmlContent.match(/<div[^>]*id=["\']preamble["\'][^>]*>(.*?)<\/div>/s);
    
    if (preambleMatch) {
      const preambleContent = preambleMatch[1];
      const paragraphs = preambleContent.match(/<p[^>]*>(.*?)<\/p>/gs);
      
      if (paragraphs && paragraphs.length > 0) {
        // Take the first substantial paragraph
        for (const paragraph of paragraphs.slice(0, 2)) {
          const cleanParagraph = paragraph
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Replace HTML entities
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (cleanParagraph.length > 50) {
            definition = cleanParagraph;
            break;
          }
        }
      }
    }
    
    // If no preamble, try to extract from main content
    if (!definition) {
      const mainContentMatch = htmlContent.match(/<div[^>]*id=["\']main-text["\'][^>]*>(.*?)<\/div>/s);
      if (mainContentMatch) {
        const paragraphs = mainContentMatch[1].match(/<p[^>]*>(.*?)<\/p>/gs);
        if (paragraphs && paragraphs.length > 0) {
          definition = paragraphs[0]
            .replace(/<[^>]*>/g, '')
            .replace(/&[a-zA-Z0-9#]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
    }
    
    // Extract related concepts from the table of contents
    let relatedConcepts = [];
    const tocMatch = htmlContent.match(/<div[^>]*id=["\']toc["\'][^>]*>(.*?)<\/div>/s);
    
    if (tocMatch) {
      const linkMatches = tocMatch[1].match(/<a[^>]*href=["\']#[^"\']*["\'][^>]*>(.*?)<\/a>/g);
      if (linkMatches) {
        relatedConcepts = linkMatches
          .map(link => link.replace(/<[^>]*>/g, '').trim())
          .filter(concept => concept.length > 3 && concept.length < 50)
          .slice(0, 5);
      }
    }
    
    // Extract bibliography for further reading
    let furtherReading = [];
    const bibMatch = htmlContent.match(/Bibliography<\/h[23]>(.*?)(?:<h[12]|$)/s);
    
    if (bibMatch) {
      const citations = bibMatch[1].match(/<li[^>]*>(.*?)<\/li>/gs);
      if (citations) {
        furtherReading = citations
          .map(citation => citation.replace(/<[^>]*>/g, '').trim())
          .filter(citation => citation.length > 10 && citation.length < 200)
          .slice(0, 5);
      }
    }
    
    const formattedData = {
      title: title,
      definition: definition || 'Stanford Encyclopedia of Philosophy entry found but content could not be extracted.',
      url: usedUrl,
      relatedConcepts: relatedConcepts,
      furtherReading: furtherReading,
      source: 'sep',
      keyPoints: [] // Remove key points as requested
    };
    
    res.json(formattedData);
    
  } catch (error) {
    console.error('❌ Error fetching SEP content:', error);
    res.status(500).json({ error: 'Failed to fetch SEP content' });
  }
});

// New API endpoint for content analysis and topic extraction from chat messages
app.post('/api/analyze-chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    // Check if OpenAI client is configured
    if (!openai) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file and restart the server.' 
      });
    }
    
    // Combine all messages into a single text for analysis
    const conversationText = messages
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');
    
    // System prompt for content analysis
    const analysisPrompt = `Analyze this philosophical conversation and extract relevant information. Return a JSON object with the following structure:

{
  "concepts": [
    {
      "id": "concept-slug",
      "name": "Concept Name",
      "mentions": 3,
      "relevance": 0.8
    }
  ],
  "philosophers": [
    {
      "id": "philosopher-slug", 
      "name": "Philosopher Name",
      "mentions": 2,
      "relevance": 0.7
    }
  ],
  "schools": [
    {
      "id": "school-slug",
      "name": "School Name", 
      "mentions": 1,
      "relevance": 0.6
    }
  ],
  "fallacies": [
    {
      "id": "fallacy-slug",
      "name": "Fallacy Name",
      "mentions": 1,
      "relevance": 0.5
    }
  ]
}

Extract philosophical concepts, philosophers, schools of thought, and logical fallacies mentioned in the conversation. Use lowercase slugs for IDs (e.g., "free-will", "john-stuart-mill"). Include mention counts and relevance scores (0-1). Only include items with at least 1 mention.`;

    // Make OpenAI API call for analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'system',
          content: analysisPrompt
        },
        {
          role: 'user', 
          content: conversationText
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    
    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse analysis result:', parseError);
      analysisResult = {
        concepts: [],
        philosophers: [],
        schools: [],
        fallacies: []
      };
    }
    
    res.json(analysisResult);
    
  } catch (error) {
    console.error('❌ Error analyzing chat content:', error);
    res.status(500).json({ error: 'Failed to analyze chat content' });
  }
});

// New API endpoint for fallacy detection
app.post('/api/detect-fallacies', async (req, res) => {
  try {
    const { userMessage } = req.body;

    // Validate request
    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'User message is required' });
    }

    // Check if OpenAI client is configured
    if (!openai) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file and restart the server.' 
      });
    }

    // System prompt specifically for fallacy detection
    const fallacyDetectionPrompt = `You are a logical fallacy detection system. Analyze the user's message and identify any logical fallacies.

Return your response as a JSON object with the following structure:
{
  "hasFallacies": true/false,
  "fallacies": [
    {
      "name": "Fallacy Name",
      "explanation": "Brief explanation of why this is a fallacy",
      "suggestion": "How to improve the argument"
    }
  ]
}

Common fallacies to look for:
- Ad Hominem: Attacking the person instead of the argument
- Straw Man: Misrepresenting someone's argument
- False Dilemma: Presenting only two options when more exist
- Circular Reasoning: Using the conclusion as evidence for itself
- Appeal to Authority: Claiming truth based solely on authority
- Appeal to Emotion: Using emotions instead of logic
- Hasty Generalization: Drawing broad conclusions from limited examples
- Slippery Slope: Assuming extreme outcomes without justification
- Red Herring: Introducing irrelevant information
- Tu Quoque: "You too" fallacy
- Bandwagon: Appeal to popularity
- False Cause: Assuming causation from correlation
- Appeal to Ignorance: Arguing something is true because it can't be proven false

Be strict but fair in your analysis. Only identify clear fallacies, not weak arguments.`;

    // Make OpenAI API call for fallacy detection
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'system',
          content: fallacyDetectionPrompt
        },
        {
          role: 'user',
          content: `Analyze this message for logical fallacies: "${userMessage}"`
        }
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 500
    });

    // Parse the JSON response
    let fallacyResult;
    try {
      fallacyResult = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse fallacy detection result:', parseError);
      fallacyResult = {
        hasFallacies: false,
        fallacies: []
      };
    }

    res.json(fallacyResult);

  } catch (error) {
    console.error('❌ Error detecting fallacies:', error);
    
    // Return appropriate error response based on error type
    if (error.status === 401) {
      res.status(401).json({ error: 'Invalid OpenAI API key' });
    } else if (error.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else if (error.status === 400) {
      res.status(400).json({ error: 'Bad request to OpenAI API' });
    } else {
      res.status(500).json({ error: 'Failed to detect fallacies. Please try again.' });
    }
  }
});

// New API endpoint for steel manning analysis
app.post('/api/steel-man', async (req, res) => {
  try {
    const { userMessage } = req.body;

    // Validate request
    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'User message is required' });
    }

    // Check if OpenAI client is configured
    if (!openai) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file and restart the server.' 
      });
    }

    // System prompt specifically for steel manning
    const steelManningPrompt = `You are a steel manning assistant. Analyze the user's argument and provide suggestions to make it stronger and more defensible.

Return your response as a JSON object with the following structure:
{
  "hasImprovements": true/false,
  "improvements": [
    {
      "category": "Category Name",
      "suggestion": "Specific suggestion to strengthen the argument",
      "reason": "Why this improvement would make the argument stronger"
    }
  ]
}

Categories to consider:
- Clarity: Make vague language more precise
- Evidence: Add supporting evidence or examples
- Scope: Better define boundaries and limitations
- Premises: Strengthen or clarify underlying assumptions
- Counterarguments: Address potential objections
- Logic: Improve logical structure
- Definitions: Define key terms more clearly

Focus on constructive improvements that would make the argument more persuasive and harder to refute. Only suggest meaningful improvements, not minor tweaks.`;

    // Make OpenAI API call for steel manning
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'system',
          content: steelManningPrompt
        },
        {
          role: 'user',
          content: `Analyze this argument and suggest improvements to make it stronger: "${userMessage}"`
        }
      ],
      temperature: 0.2, // Low temperature for consistent analysis
      max_tokens: 600
    });

    // Parse the JSON response
    let steelManResult;
    try {
      steelManResult = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse steel manning result:', parseError);
      steelManResult = {
        hasImprovements: false,
        improvements: []
      };
    }

    res.json(steelManResult);

  } catch (error) {
    console.error('❌ Error analyzing argument for steel manning:', error);
    
    // Return appropriate error response based on error type
    if (error.status === 401) {
      res.status(401).json({ error: 'Invalid OpenAI API key' });
    } else if (error.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else if (error.status === 400) {
      res.status(400).json({ error: 'Bad request to OpenAI API' });
    } else {
      res.status(500).json({ error: 'Failed to analyze argument. Please try again.' });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'sophron-bot server is running',
    timestamp: new Date().toISOString(),
    hasApiKey: !!openai
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'sophron-bot API Server',
    endpoints: [
      'POST /api/chat - Send chat messages',
      'GET /api/health - Health check'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 sophron-bot server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 OpenAI API key configured: ${!!openai}`);
}); 