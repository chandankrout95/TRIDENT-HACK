import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import errorHandler from './middleware/errorHandler.js';
import { addOptimizations } from './config/optimization.js';

const app = express();

// Apply Optimizations (Helmet, RateLimit, Morgan)
addOptimizations(app);

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Placeholder Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import therapistRoutes from './routes/therapist.routes.js';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import exercisesRoutes from './routes/exercises.routes.js';
import moodTrackingRoutes from './routes/moodTracking.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import therapistsRoutes from './routes/therapists.routes.js';
import usersRoutes from './routes/users.routes.js';
import agoraRoutes from './routes/agora.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import aiChatRoutes from './routes/aiChat.routes.js';
import sleepTherapyRoutes from './routes/sleepTherapy.routes.js';
import healthRoutes from './routes/health.routes.js';

import fcmTokenRoutes from './routes/fcmToken.routes.js';

// Route integration
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/therapist', therapistRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/mood-tracking', moodTrackingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/therapists', therapistsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/sleep-therapy', sleepTherapyRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/fcm', fcmTokenRoutes);

// Error Handling Middleware

// Global Error Handler
app.use(errorHandler);

export default app;
