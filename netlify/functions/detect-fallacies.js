import OpenAI from 'openai';

// Initialize OpenAI client conditionally - only if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Netlify Function handler - exact logic from server/index.js app.post('/api/detect-fallacies')
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

    // System prompt specifically for fallacy detection - exact prompt from server/index.js
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

    // Make OpenAI API call for fallacy detection - exact parameters from server/index.js
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

    // Parse the JSON response - exact logic from server/index.js
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(fallacyResult)
    };

  } catch (error) {
    console.error('❌ Error detecting fallacies:', error);
    
    // Return appropriate error response based on error type - exact logic from server/index.js
    let statusCode = 500;
    let errorMessage = 'Failed to detect fallacies. Please try again.';
    
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