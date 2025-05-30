import OpenAI from 'openai';

// Initialize OpenAI client conditionally - only if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Netlify Function handler - exact logic from server/index.js app.post('/api/analyze-chat')
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages } = JSON.parse(event.body);
    
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }
    
    // Check if OpenAI client is configured
    if (!openai) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file and restart the server.' 
        })
      };
    }
    
    // Combine all messages into a single text for analysis - exact logic from server/index.js
    const conversationText = messages
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');
    
    // System prompt for content analysis - exact prompt from server/index.js
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

    // Make OpenAI API call for analysis - exact parameters from server/index.js
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
    
    // Parse the JSON response - exact logic from server/index.js
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
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(analysisResult)
    };
    
  } catch (error) {
    console.error('❌ Error analyzing chat content:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to analyze chat content' })
    };
  }
}; 