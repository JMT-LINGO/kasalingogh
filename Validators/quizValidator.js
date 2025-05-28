import Joi from "joi";



// Schema for creating a new quiz
export const createQuizSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Quiz title is required',
      'string.min': 'Quiz title must be at least 5 characters long',
      'string.max': 'Quiz title cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Quiz description is required',
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 500 characters'
    }),

  language: Joi.string()
    .valid('twi', 'ewe', 'fante', 'ga')
    .required()
    .messages({
      'any.only': 'Language must be one of: twi, ewe, fante, ga',
      'any.required': 'Please specify a language'
    }),

  difficulty: Joi.string()
    .valid('beginner', 'intermediate', 'advanced')
    .required()
    .messages({
      'any.only': 'Difficulty must be beginner, intermediate, or advanced',
      'any.required': 'Difficulty level is required'
    }),

  ageRange: Joi.object({
    min: Joi.number()
      .integer()
      .min(4)
      .max(12)
      .required()
      .messages({
        'number.min': 'Minimum age must be at least 4',
        'number.max': 'Minimum age cannot exceed 12'
      }),
    max: Joi.number()
      .integer()
      .min(4)
      .max(12)
      .required()
      .messages({
        'number.min': 'Maximum age must be at least 4',
        'number.max': 'Maximum age cannot exceed 12'
      })
  }).required().custom((value, helpers) => {
    if (value.max < value.min) {
      return helpers.error('ageRange.invalid');
    }
    return value;
  }).messages({
    'ageRange.invalid': 'Maximum age must be greater than or equal to minimum age'
  }),

  questions: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .length(5)
    .required()
    .messages({
      'array.length': 'Quiz must contain exactly 5 questions',
      'string.pattern.base': 'Invalid question ID format',
      'any.required': 'Questions are required'
    }),

  category: Joi.string()
    .valid('vocabulary', 'grammar', 'reading', 'writing')
    .required()
    .messages({
      'any.only': 'Category must be one of: vocabulary, grammar, reading, writing',
      'any.required': 'Category is required'
    }),

  isActive: Joi.boolean().default(true)
});

// Schema for updating a quiz
export const updateQuizSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .messages({
      'string.min': 'Quiz title must be at least 5 characters long',
      'string.max': 'Quiz title cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 500 characters'
    }),

  language: Joi.string()
    .valid('twi', 'ewe', 'fante', 'ga')
    .messages({
      'any.only': 'Language must be one of: twi, ewe, fante, ga'
    }),

  difficulty: Joi.string()
    .valid('beginner', 'intermediate', 'advanced')
    .messages({
      'any.only': 'Difficulty must be beginner, intermediate, or advanced'
    }),

  ageRange: Joi.object({
    min: Joi.number().integer().min(4).max(12),
    max: Joi.number().integer().min(4).max(12)
  }).custom((value, helpers) => {
    if (value.max < value.min) {
      return helpers.error('ageRange.invalid');
    }
    return value;
  }).messages({
    'ageRange.invalid': 'Maximum age must be greater than or equal to minimum age'
  }),

  questions: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .length(5)
    .messages({
      'array.length': 'Quiz must contain exactly 30 questions',
      'string.pattern.base': 'Invalid question ID format'
    }),

  category: Joi.string()
    .valid('vocabulary', 'grammar', 'reading', 'writing')
    .messages({
      'any.only': 'Category must be one of: vocabulary, grammar, reading, writing'
    }),

  isActive: Joi.boolean()
});

// Validation helper functions
export const validateCreateQuiz = (data) => {
  const { error, value } = createQuizSchema.validate(data, { abortEarly: false });
  return {
    isValid: !error,
    data: value,
    errors: error ? error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    })) : []
  };
};

export const validateUpdateQuiz = (data) => {
  const { error, value } = updateQuizSchema.validate(data, { abortEarly: false });
  return {
    isValid: !error,
    data: value,
    errors: error ? error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    })) : []
  };
};
