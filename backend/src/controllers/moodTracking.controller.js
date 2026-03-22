import MoodTracking from '../models/moodTracking.model.js';
import User from '../models/auth.model.js';
import { sendPushNotification } from '../services/pushNotification.service.js';

// POST /mood-tracking — log a mood entry, award points
export const logMood = async (req, res) => {
  try {
    const { mood, score, note, context } = req.body;
    const userId = req.user._id;

    // Award 2 points for each mood check-in
    const pointsEarned = 2;

    const log = await MoodTracking.create({
      user: userId,
      mood,
      score,
      note: note || '',
      pointsEarned,
      context: context || 'manual',
    });

    // Update user points
    await User.findByIdAndUpdate(userId, { $inc: { points: pointsEarned } });

    res.status(201).json({
      ...log.toObject(),
      totalPoints: (await User.findById(userId).select('points').lean())?.points || 0,
    });
  } catch (err) {
    console.error('Mood log error:', err);
    res.status(500).json({ message: 'Error logging mood' });
  }
};

// GET /mood-tracking/today — get today's mood entries
export const getTodayMoods = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const moods = await MoodTracking.find({
      user: userId,
      createdAt: { $gte: startOfDay },
    }).sort({ createdAt: -1 }).lean();

    // Calculate last entry time for the 10-min prompt
    const lastEntryAt = moods.length > 0 ? moods[0].createdAt : null;
    
    // Quick heuristic: If it's been more than 10 mins since the last entry (or no entry today)
    // we could trigger a push right away. However, since the frontend hits this endpoint on mount and focus,
    // we should only push occasionally to avoid spam. To prevent server-side spam, we'll only send the push 
    // if `lastEntryAt` is exactly defined and the elapsed time is > 10 mins, but usually we just let the frontend prompt.
    // For "real" background push, we would use a cron job. Let's send a push if it's been exactly over 10 mins since the very first focus hit.
    if (lastEntryAt) {
      const elapsed = (now - new Date(lastEntryAt)) / 1000 / 60;
      if (elapsed >= 10 && elapsed <= 15) { // 10-15 min window to avoid spam on every focus
        sendPushNotification(userId, 'Mood Check-in', 'It has been 10 minutes since your last check-in. How are you feeling?', { type: 'mood' });
      }
    } else if (now.getHours() >= 9 && now.getHours() <= 21 && moods.length === 0) {
      // If it's daytime and no mood logged today, send a gentle reminder
        sendPushNotification(userId, 'Daily Mood Check-in', 'How are you feeling today? Tap to log your mood.', { type: 'mood' });
    }

    res.json({
      moods,
      count: moods.length,
      lastEntryAt: lastEntryAt,
      averageScore: moods.length > 0
        ? Math.round((moods.reduce((s, m) => s + m.score, 0) / moods.length) * 10) / 10
        : null,
    });
  } catch (err) {
    console.error('Today moods error:', err);
    res.status(500).json({ message: 'Error fetching moods' });
  }
};

// GET /mood-tracking/history — get mood history (last 30 days)
export const getMoodHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moods = await MoodTracking.find({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 }).lean();

    // Group by day for the chart
    const dailyAvg = {};
    moods.forEach(m => {
      const day = new Date(m.createdAt).toISOString().split('T')[0];
      if (!dailyAvg[day]) dailyAvg[day] = { total: 0, count: 0 };
      dailyAvg[day].total += m.score;
      dailyAvg[day].count += 1;
    });

    const chartData = Object.entries(dailyAvg)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, { total, count }]) => ({
        date,
        avgScore: Math.round((total / count) * 10) / 10,
        entries: count,
      }));

    res.json({
      entries: moods,
      chartData,
      totalEntries: moods.length,
    });
  } catch (err) {
    console.error('Mood history error:', err);
    res.status(500).json({ message: 'Error fetching mood history' });
  }
};
