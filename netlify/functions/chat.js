import OpenAI from 'openai';

// Initialize OpenAI client conditionally - only if API key is provided
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Base system prompt for the bot - copied exactly from server/index.js
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

// Steel-manning mode system prompt - copied exactly from server/index.js
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

// Debate mode system prompt - copied exactly from server/index.js
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

// Netlify Function handler - exact logic from server/index.js app.post('/api/chat')
export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, detectFallacies = false, steelManningMode = false, isStrengtheningPhase = false, selectedStyle = '', isDebateMode = false } = JSON.parse(event.body);

    // Validate request
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
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY environment variable.' 
        })
      };
    }

    // Build style-specific prompt additions - exact logic from server/index.js
    let stylePrompt = '';
    if (selectedStyle === 'socratic') {
      stylePrompt = '\n\nYou must use the Socratic method: ask probing questions to guide the user to deeper understanding rather than making direct statements. Challenge them through thoughtful questions that expose assumptions and lead them to examine their beliefs more carefully.';
    } else if (selectedStyle === 'formal') {
      stylePrompt = '\n\nYou must use formal logic structures: Begin responses with "Premise 1:", "Premise 2:", etc., followed by "Conclusion:". Use logical connectives (if-then, and, or, not, therefore). Identify the logical structure of their argument explicitly. Use terms like "valid/invalid", "sound/unsound", "logical form", and cite specific logical principles when applicable.';
    } else if (selectedStyle === 'devil') {
      stylePrompt = '\n\nYou must take the devil\'s advocate position: challenge the user\'s claims regardless of your own position, find weaknesses in their arguments, present counterarguments, and push them to defend their position more rigorously. Debate the user directly, do not make passive arguments for why others might not agree';
    }

    // Determine which system prompt to use based on mode and phase - exact logic from server/index.js
    let systemPrompt;
    if (steelManningMode && isStrengtheningPhase) {
      systemPrompt = STEEL_MANNING_PROMPT + stylePrompt;
    } else if (isDebateMode) {
      systemPrompt = DEBATE_MODE_PROMPT + stylePrompt;
    } else {
      systemPrompt = BASE_SYSTEM_PROMPT + stylePrompt;
    }

    // Format messages for OpenAI API - exact logic from server/index.js
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

    // Make OpenAI API call - exact parameters from server/index.js
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        message: response.choices[0].message.content 
      })
    };

  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to get response from AI. Please try again.';
    
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