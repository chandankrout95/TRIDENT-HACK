import Joi from 'joi';

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(15).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'therapist').default('user'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

const userInfoSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  age: Joi.number().integer().min(13).max(120).optional(),
  dob: Joi.date().iso().optional(),
  hobby: Joi.string().max(200).optional().allow(''),
  occupation: Joi.string().max(200).optional().allow(''),
  gender: Joi.string().valid('male', 'female', 'other', '').optional(),
  bio: Joi.string().max(500).optional().allow(''),
});

export {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  userInfoSchema,
};
