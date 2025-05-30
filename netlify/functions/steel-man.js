import OpenAI from 'openai';

// Initialize OpenAI client conditionally - only if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Netlify Function handler - exact logic from server/index.js app.post('/api/steel-man')
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userMessage } = JSON.parse(event.body);

    // Validate request
    if (!userMessage || typeof userMessage !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User message is required' })
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

    // System prompt specifically for steel manning - exact prompt from server/index.js
    const steelManningPrompt = `You are a steel manning assistant. Analyze the user's argument and provide suggestions to make it stronger and more defensible.

Return your response as a JSON object with the following structure:
{
  "hasImprovements": true/false,
  "improvements": [
    {
      "category": "Category Name",
      "suggestion": "Specific suggestion to strengthen the argument",
      "reason": "Why this improvement would make the argument stronger",
      "example": "Here's how you could rewrite this part: '[specific example text]'"
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

For each suggestion, provide a concrete example showing exactly how the user could improve their specific argument. Use their actual words when possible and show the improved version.

Focus on constructive improvements that would make the argument more persuasive and harder to refute. Only suggest meaningful improvements, not minor tweaks.`;

    // Make OpenAI API call for steel manning - exact parameters from server/index.js
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

    // Parse the JSON response - exact logic from server/index.js
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(steelManResult)
    };

  } catch (error) {
    console.error('❌ Error analyzing argument for steel manning:', error);
    
    // Return appropriate error response based on error type - exact logic from server/index.js
    let statusCode = 500;
    let errorMessage = 'Failed to analyze argument. Please try again.';
    
    if (error.status === 401) {
      statusCode = 401;
      errorMessage = 'Invalid OpenAI API key';
    } else if (error.status === 429) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.status === 400) {
      statusCode = 400;
      errorMessage = 'Bad request to OpenAI API';
    }

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: errorMessage })
    };
  }
}; 