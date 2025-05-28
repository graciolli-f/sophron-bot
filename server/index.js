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
const BASE_SYSTEM_PROMPT = `You are a philosophical debate bot named sophron-bot. You must respond with logically sound arguments, debate with the user in a structured manner, and always in good faith. Your goals:

    Respond directly to the user's claim using formal reasoning

    Reference major philosophical positions when relevant

    Ask clarifying questions if the claim is vague

    Avoid logical fallacies

    Conclude a debate if the user's claim is internally inconsistent or you both reach agreement

Do not use filler or fluff. Be precise, firm, and fair. 

Keep your responses short and concise (< 50 words). Don't provide more information than is necessary. `;

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

// API endpoint for chat completions
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, detectFallacies = false, steelManningMode = false, isStrengtheningPhase = false, selectedStyle = '' } = req.body;

    // Log received parameters for debugging
    console.log('🔧 Backend received parameters:', {
      detectFallacies,
      steelManningMode,
      isStrengtheningPhase,
      selectedStyle,
      messageCount: messages?.length || 0
    });

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
      console.log('🎭 Applying Socratic method style'); // Added console log for style application
      stylePrompt = '\n\nYou must use the Socratic method: ask probing questions to guide the user to deeper understanding rather than making direct statements. Challenge them through thoughtful questions that expose assumptions and lead them to examine their beliefs more carefully.';
    } else if (selectedStyle === 'formal') {
      console.log('🔬 Applying formal logic style'); // Added console log for style application
      stylePrompt = '\n\nYou must use formal logic structures: Begin responses with "Premise 1:", "Premise 2:", etc., followed by "Conclusion:". Use logical connectives (if-then, and, or, not, therefore). Identify the logical structure of their argument explicitly. Use terms like "valid/invalid", "sound/unsound", "logical form", and cite specific logical principles when applicable.';
    } else if (selectedStyle === 'devil') {
      console.log('😈 Applying devil\'s advocate style'); // Added console log for style application
      stylePrompt = '\n\nYou must take the devil\'s advocate position: challenge the user\'s claims regardless of your own position, find weaknesses in their arguments, present counterarguments, and push them to defend their position more rigorously.';
    } else if (selectedStyle === '') {
      console.log('💬 No specific style selected - using base mode'); // Added console log for no style
    } else {
      console.log('❓ Unknown style selected:', selectedStyle); // Added console log for unknown styles
    }

    // Determine which system prompt to use based on mode and phase
    let systemPrompt;
    if (steelManningMode && isStrengtheningPhase) {
      // In steel-manning strengthening phase: help improve the argument
      console.log('⚡ Using steel-manning strengthening mode'); // Added console log for mode selection
      systemPrompt = STEEL_MANNING_PROMPT + stylePrompt; // Added style-specific instructions to steel-manning mode
    } else {
      // Normal debate mode: use base prompt with optional fallacy detection and style
      console.log('💭 Using normal debate mode'); // Added console log for mode selection
      systemPrompt = BASE_SYSTEM_PROMPT;
      if (detectFallacies) {
        console.log('🔍 Adding fallacy detection to system prompt'); // Added console log for fallacy detection
        systemPrompt += FALLACY_DETECTION_PROMPT;
      }
      systemPrompt += stylePrompt; // Added style-specific instructions to all debate responses
    }

    console.log('📜 Final system prompt length:', systemPrompt.length, 'characters'); // Added console log for final prompt info

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
    console.log('🤖 Calling OpenAI API...'); // Added console log for API call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('✅ OpenAI API response received successfully'); // Added console log for successful response
    
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