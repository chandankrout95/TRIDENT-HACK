import Joi from 'joi';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('user', 'therapist').default('user')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
  otp: Joi.string().length(6).optional()
});

export { 
  registerSchema,
  loginSchema
 };
