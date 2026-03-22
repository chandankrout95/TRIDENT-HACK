import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Health Snapshot schema (inline — stores last 7 syncs)
const healthSnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  snapshots: [{
    total_steps: { type: Number, default: 0 },
    very_active_minutes: { type: Number, default: 0 },
    fairly_active_minutes: { type: Number, default: 0 },
    lightly_active_minutes: { type: Number, default: 0 },
    sedentary_minutes: { type: Number, default: 0 },
    total_minutes_asleep: { type: Number, default: 0 },
    total_time_in_bed: { type: Number, default: 0 },
    heart_rate_mean: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  }],
});

const HealthSnapshot = mongoose.model('HealthSnapshot', healthSnapshotSchema);

router.use(protect);

// POST /api/health/sync — Store a health snapshot (keeps last 7)
router.post('/sync', async (req, res) => {
  try {
    const { vitals } = req.body;

    const snapshot = {
      total_steps: vitals.steps || 0,
      very_active_minutes: vitals.veryActiveMinutes || 0,
      fairly_active_minutes: vitals.fairlyActiveMinutes || 0,
      lightly_active_minutes: vitals.lightlyActiveMinutes || 0,
      sedentary_minutes: vitals.sedentaryMinutes || 0,
      total_minutes_asleep: vitals.totalMinutesAsleep || 0,
      total_time_in_bed: vitals.totalTimeInBed || 0,
      heart_rate_mean: vitals.heartRate || 0,
      calories: vitals.calories || 0,
      date: new Date(),
    };

    let record = await HealthSnapshot.findOne({ userId: req.user._id });

    if (!record) {
      record = await HealthSnapshot.create({ userId: req.user._id, snapshots: [snapshot] });
    } else {
      record.snapshots.push(snapshot);
      // Keep only last 7
      if (record.snapshots.length > 7) {
        record.snapshots = record.snapshots.slice(-7);
      }
      await record.save();
    }

    res.json({ message: 'Snapshot saved', count: record.snapshots.length });
  } catch (error) {
    console.error('Health sync error:', error);
    res.status(500).json({ message: 'Failed to save health snapshot' });
  }
});

// DELETE /api/health/clear — Clear stored snapshots (Reset cache)
router.delete('/clear', async (req, res) => {
  try {
    await HealthSnapshot.findOneAndDelete({ userId: req.user._id });
    res.json({ message: 'Health cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ message: 'Failed to clear cache' });
  }
});

// GET /api/health/snapshots — Get stored snapshots
router.get('/snapshots', async (req, res) => {
  try {
    const record = await HealthSnapshot.findOne({ userId: req.user._id }).lean();
    res.json(record?.snapshots || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch snapshots' });
  }
});

// POST /api/health/compare — Proxy to the ML compare API
router.post('/compare', async (req, res) => {
  try {
    const record = await HealthSnapshot.findOne({ userId: req.user._id }).lean();
    const snapshots = record?.snapshots || [];

    let yesterday, today;

    if (snapshots.length >= 2) {
      yesterday = snapshots[snapshots.length - 2];
      today = snapshots[snapshots.length - 1];
    } else if (snapshots.length === 1) {
      yesterday = { total_steps: 0, very_active_minutes: 0, fairly_active_minutes: 0, lightly_active_minutes: 0, sedentary_minutes: 0, total_minutes_asleep: 0, total_time_in_bed: 0, heart_rate_mean: 0, calories: 0 };
      today = snapshots[0];
    } else {
      return res.json({
        performance_score: 0,
        score_improvement: 0,
        overall_change_pct: 0,
        metric_breakdown: { step_growth: '0%', sleep_growth: '0%', intensity_growth: '0%', sedentary_change: '0%' },
        coach_recommendation: 'Start syncing your health data to get personalized insights!',
        snapshots: [],
      });
    }

    const payload = {
      yesterday: {
        total_steps: yesterday.total_steps,
        very_active_minutes: yesterday.very_active_minutes,
        fairly_active_minutes: yesterday.fairly_active_minutes,
        lightly_active_minutes: yesterday.lightly_active_minutes,
        sedentary_minutes: yesterday.sedentary_minutes,
        total_minutes_asleep: yesterday.total_minutes_asleep,
        total_time_in_bed: yesterday.total_time_in_bed,
        heart_rate_mean: yesterday.heart_rate_mean,
        calories: yesterday.calories,
      },
      today: {
        total_steps: today.total_steps,
        very_active_minutes: today.very_active_minutes,
        fairly_active_minutes: today.fairly_active_minutes,
        lightly_active_minutes: today.lightly_active_minutes,
        sedentary_minutes: today.sedentary_minutes,
        total_minutes_asleep: today.total_minutes_asleep,
        total_time_in_bed: today.total_time_in_bed,
        heart_rate_mean: today.heart_rate_mean,
        calories: today.calories,
      },
    };

    // Try calling the ML API
    let analysisResult;
    try {
      const mlRes = await fetch('https://2ktl27x7-8501.inc1.devtunnels.ms/analyze/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      analysisResult = await mlRes.json();
    } catch (mlErr) {
      console.warn('ML API unavailable, using fallback:', mlErr.message);
      analysisResult = {
        performance_score: 5,
        score_improvement: 0,
        overall_change_pct: 0,
        metric_breakdown: { step_growth: '0%', sleep_growth: '0%', intensity_growth: '0%', sedentary_change: '0%' },
        coach_recommendation: 'Keep moving and maintaining a healthy routine!',
      };
    }

    res.json({
      ...analysisResult,
      snapshots: snapshots.map(s => ({
        steps: s.total_steps,
        calories: s.calories,
        sleep: s.total_minutes_asleep,
        heartRate: s.heart_rate_mean,
        date: s.date,
      })),
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ message: 'Failed to analyze health data' });
  }
});

export default router;
