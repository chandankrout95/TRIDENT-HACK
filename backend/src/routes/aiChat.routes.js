import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';
import AIMessage from '../models/aiMessage.model.js';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer for audio file uploads (temp disk storage)
const audioUpload = multer({
  dest: path.join(__dirname, '../../tmp/audio'),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const groq = new Groq({
  apiKey: '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',
});

router.use(protect);

// POST /api/ai-chat/transcribe — speech-to-text via Groq Whisper
router.post('/transcribe', audioUpload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    const language = req.body.language || 'en'; // 'en' or 'hi'

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-large-v3',
      language,
      response_format: 'text',
    });

    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    const text = typeof transcription === 'string' ? transcription.trim() : (transcription.text || '').trim();

    if (!text) {
      return res.status(400).json({ message: 'Could not transcribe audio. Please try again.' });
    }

    res.json({ text });
  } catch (error) {
    // Clean up temp file on error
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error('Transcription error:', error);
    res.status(500).json({ message: 'Transcription failed' });
  }
});

// GET /api/ai-chat/:persona — fetch conversation history for a specific persona
router.get('/:persona', async (req, res, next) => {
  try {
    const { persona } = req.params;
    const messages = await AIMessage.find({
      sender: req.user._id,
      persona,
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/ai-chat/:persona — clear conversation for a persona
router.delete('/:persona', async (req, res, next) => {
  try {
    const { persona } = req.params;
    await AIMessage.deleteMany({
      sender: req.user._id,
      persona,
    });
    res.json({ message: 'Conversation cleared' });
  } catch (error) {
    next(error);
  }
});

export default router;
