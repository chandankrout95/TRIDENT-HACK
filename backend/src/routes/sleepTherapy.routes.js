import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import SleepSession from '../models/sleepSession.model.js';
import Groq from 'groq-sdk';

const router = express.Router();

const groq = new Groq({
  apiKey: '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',
});

router.use(protect);

// POST /api/sleep-therapy/generate-session
// AI analyzes user data and returns optimized binaural beat parameters
router.post('/generate-session', async (req, res) => {
  try {
    const { mood, sleepGoal, soundPreference, duration, vitals } = req.body;

    const prompt = `You are a sleep science AI. Based on the user's data, return ONLY a valid JSON object with optimized binaural beat parameters for sleep therapy. No markdown, no explanation — just the JSON.

User Data:
- Mood: ${mood}
- Sleep Goal: ${sleepGoal} (fall_asleep = help them drift off, deep_sleep = maximize deep sleep phases, power_nap = quick 20min recovery, relax = calm anxiety)
- Sound Preference: ${soundPreference}
- Desired Duration: ${duration} minutes
- Heart Rate: ${vitals?.heartRate || 'unknown'} bpm
- Steps Today: ${vitals?.steps || 'unknown'}
- Sleep Last Night: ${vitals?.sleep || 'unknown'}

Return this exact JSON structure:
{
  "baseFrequency": <number 150-250, carrier tone Hz>,
  "binauralOffset": <number 1-8, the binaural beat Hz. Use 1-3 for deep sleep, 3-5 for light sleep/nap, 5-8 for relaxation>,
  "volumeProfile": "<string: 'gradual_fade' or 'steady' or 'wave'>",
  "personalizedTip": "<string: one short sleep tip based on their data, max 15 words>",
  "sessionInsight": "<string: brief explanation of chosen frequency, max 20 words>"
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    let aiText = completion.choices[0]?.message?.content || '';

    // Extract JSON from response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    let sessionParams;

    if (jsonMatch) {
      try {
        sessionParams = JSON.parse(jsonMatch[0]);
      } catch {
        sessionParams = null;
      }
    }

    // Fallback defaults if AI response parsing fails
    if (!sessionParams) {
      const offsetMap = { fall_asleep: 2.5, deep_sleep: 1.5, power_nap: 4, relax: 6 };
      sessionParams = {
        baseFrequency: 200,
        binauralOffset: offsetMap[sleepGoal] || 3,
        volumeProfile: 'gradual_fade',
        personalizedTip: 'Try deep breathing before starting the session.',
        sessionInsight: 'Delta waves at ' + (offsetMap[sleepGoal] || 3) + 'Hz for optimal rest.',
      };
    }

    // Save session to DB
    const session = await SleepSession.create({
      userId: req.user._id,
      mood,
      sleepGoal,
      soundPreference,
      frequencies: {
        baseFrequency: sessionParams.baseFrequency,
        binauralOffset: sessionParams.binauralOffset,
        recommendedDuration: duration,
      },
      aiTip: sessionParams.personalizedTip,
      durationMinutes: duration,
    });

    res.json({
      sessionId: session._id,
      ...sessionParams,
      duration,
      soundPreference,
    });
  } catch (error) {
    console.error('Sleep therapy generation error:', error);
    res.status(500).json({ message: 'Failed to generate sleep session' });
  }
});

// POST /api/sleep-therapy/complete-session
router.post('/complete-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    await SleepSession.findByIdAndUpdate(sessionId, { completed: true });
    res.json({ message: 'Session marked as complete' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update session' });
  }
});

// GET /api/sleep-therapy/history — get past sessions
router.get('/history', async (req, res) => {
  try {
    const sessions = await SleepSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

export default router;
