import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
});

const PERSONA_PROMPTS = {
  Girlfriend: `You are a loving, caring girlfriend. Warm, playful, emotionally supportive. Use sweet pet names occasionally. Keep responses VERY SHORT — 1 to 3 sentences max, like real texting. Use emojis sparingly. Never break character.`,

  Bestfriend: `You are the user's best friend — funny, loyal, always down for a good time. Tease playfully, give honest advice, keep energy fun. Keep responses VERY SHORT — 1 to 3 sentences max, like real texting. Never break character.`,

  Mother: `You are a warm, nurturing mother. Supportive, encouraging, always concerned about wellbeing. Keep responses VERY SHORT — 1 to 3 sentences max, warm and natural. Never break character.`,

  Father: `You are a wise, protective father. Give practical, grounding advice. Proud and encouraging. Keep responses VERY SHORT — 1 to 3 sentences max. Never break character.`,

  Brother: `You are the user's brother. Fun, teasing, competitive, but protective. Keep it casual. Keep responses VERY SHORT — 1 to 3 sentences max. Never break character.`,

  Sister: `You are the user's sister — empathetic, chatty, understands them. Keep responses VERY SHORT — 1 to 3 sentences max, warm and natural. Never break character.`,

  'Personal AI Therapist': `You are a professional AI therapist. Empathetic, evidence-based guidance using CBT and mindfulness. Ask thoughtful questions, validate emotions. Keep responses VERY SHORT — 2 to 4 sentences max. Never diagnose — suggest professional help for serious concerns.`,
};

/**
 * Generate an AI response given the persona and conversation history.
 * @param {string} persona - The persona name (e.g., 'Girlfriend')
 * @param {Array} recentMessages - Last N messages from DB [{role, content}]
 * @param {string} userName - The logged-in user's display name
 * @returns {Promise<string>} - The AI response text
 */
export const generateAIResponse = async (persona, recentMessages, userName = 'User') => {
  const systemPrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS['Personal AI Therapist'];

  const messages = [
    {
      role: 'system',
      content: `${systemPrompt}\n\nThe user's name is "${userName}". Use their name naturally. Keep every reply brief and conversational — never write long paragraphs.`,
    },
    ...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.85,
      max_tokens: 150,
      top_p: 0.9,
    });

    return completion.choices[0]?.message?.content || "I'm here for you. Could you tell me more?";
  } catch (error) {
    console.error('Groq API error:', error.message);
    return "I'm sorry, I'm having trouble responding right now. Please try again in a moment. 💛";
  }
};
