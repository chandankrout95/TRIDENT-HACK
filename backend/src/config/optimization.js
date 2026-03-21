import morgan from 'morgan';
import winston from 'winston';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 1. Winston Logger config
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// 2. Optimization Middlewares Function
const addOptimizations = (app) => {
  // Security Headers
  app.use(helmet());
  
  // Rate Limiting (Prevents Brute Force/DDoS basics)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
  });
  app.use('/api/', apiLimiter);

  // HTTP Request Logging
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
};

export {  logger, addOptimizations  };
