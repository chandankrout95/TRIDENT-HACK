import Joi from 'joi';

const therapistPersonalInfoSchema = Joi.object({
  qualification: Joi.string().min(2).max(200).required(),
  experience: Joi.string().min(1).max(200).required(),
  specialization: Joi.string().min(2).max(200).required(),
  bio: Joi.string().max(1000).optional().allow(''),
  age: Joi.number().integer().min(21).max(100).optional(),
  dob: Joi.date().iso().optional(),
  licenseNumber: Joi.string().optional().allow(''),
  hourlyRate: Joi.number().min(0).optional(),
  languages: Joi.array().items(Joi.string()).optional(),
});

const rejectTherapistSchema = Joi.object({
  rejectionNote: Joi.string().min(5).max(500).required(),
});

export {
  therapistPersonalInfoSchema,
  rejectTherapistSchema,
};
