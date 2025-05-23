import Joi from 'joi';

// Base validation schema for questions
export const questionValidationSchema = Joi.object({
  text: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required()
    .messages({
      'any.required': 'Please add question text',
      'string.empty': 'Question text cannot be empty',
      'string.min': 'Question text must be at least 5 characters long',
      'string.max': 'Question text cannot exceed 500 characters'
    }),

  language: Joi.string()
    .valid('twi', 'ewe', 'fante', 'ga')
    .required()
    .messages({
      'any.required': 'Please specify language',
      'any.only': 'Language must be one of: twi, ewe, fante, ga'
    }),

  type: Joi.string()
    .valid('multiple-choice', 'fill-in-blank', 'spelling')
    .required()
    .messages({
      'any.required': 'Question type is required',
      'any.only': 'Type must be one of: multiple-choice, fill-in-blank, spelling'
    }),

  options: Joi.array()
    .items(
      Joi.object({
        text: Joi.string()
          .trim()
          .min(1)
          .max(200)
          .required()
          .messages({
            'string.empty': 'Option text cannot be empty',
            'string.max': 'Option text cannot exceed 200 characters'
          }),
        isCorrect: Joi.boolean()
          .required()
          .messages({
            'any.required': 'isCorrect field is required for each option'
          })
      })
    )
    .min(0)
    .max(6)
    .messages({
      'array.max': 'Maximum 6 options allowed'
    }),

  explanation: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'any.required': 'Explanation is required',
      'string.min': 'Explanation must be at least 10 characters long',
      'string.max': 'Explanation cannot exceed 1000 characters'
    }),

  points: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .required()
    .messages({
      'any.required': 'Points value is required',
      'number.min': 'Points must be at least 1',
      'number.max': 'Points cannot exceed 10',
      'number.integer': 'Points must be a whole number'
    }),

  difficultyLevel: Joi.string()
    .valid('beginner', 'intermediate', 'advanced')
    .required()
    .messages({
      'any.required': 'Difficulty level is required',
      'any.only': 'Difficulty level must be one of: beginner, intermediate, advanced'
    }),

  ageRange: Joi.object({
    min: Joi.number()
      .integer()
      .min(4)
      .max(12)
      .required()
      .messages({
        'any.required': 'Minimum age is required',
        'number.min': 'Minimum age must be at least 4',
        'number.max': 'Minimum age cannot exceed 12',
        'number.integer': 'Age must be a whole number'
      }),
    max: Joi.number()
      .integer()
      .min(4)
      .max(12)
      .required()
      .greater(Joi.ref('min'))
      .messages({
        'any.required': 'Maximum age is required',
        'number.min': 'Maximum age must be at least 4',
        'number.max': 'Maximum age cannot exceed 12',
        'number.integer': 'Age must be a whole number',
        'number.greater': 'Maximum age must be greater than or equal to minimum age'
      })
  }).required(),

  category: Joi.string()
    .valid('vocabulary', 'grammar', 'reading', 'writing')
    .required()
    .messages({
      'any.required': 'Category is required',
      'any.only': 'Category must be one of: vocabulary, grammar, pronunciation, reading, writing'
    }),

//   imageUrl: Joi.string()
//     .uri({ scheme: ['http', 'https'] })
//     .optional()
//     .allow('')
//     .messages({
//       'string.uri': 'Please provide a valid HTTP/HTTPS URL for image'
//     }),

//   audioUrl: Joi.string()
//     .uri({ scheme: ['http', 'https'] })
//     .optional()
//     .allow('')
//     .messages({
//       'string.uri': 'Please provide a valid HTTP/HTTPS URL for audio'
//     }),

  hint: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Hint cannot exceed 200 characters'
    })
});

// Custom validation function with business logic
export const validateQuestion = (questionData) => {
  const { error, value } = questionValidationSchema.validate(questionData, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    };
  }

  // Additional business logic validation
  const businessLogicErrors = [];

  // Validate options based on question type
  if (value.type === 'multiple-choice') {
    if (!value.options || value.options.length < 2) {
      businessLogicErrors.push({
        field: 'options',
        message: 'Multiple choice questions must have at least 2 options'
      });
    } else {
      const correctAnswers = value.options.filter(option => option.isCorrect);
      if (correctAnswers.length === 0) {
        businessLogicErrors.push({
          field: 'options',
          message: 'Multiple choice questions must have at least one correct answer'
        });
      } else if (correctAnswers.length > 1) {
        businessLogicErrors.push({
          field: 'options',
          message: 'Multiple choice questions should have exactly one correct answer'
        });
      }
    }
  } else if (value.type === 'fill-in-blank' || value.type === 'spelling') {
    // For fill-in-blank and spelling, options are optional but if provided, need correct answers
    if (value.options && value.options.length > 0) {
      const correctAnswers = value.options.filter(option => option.isCorrect);
      if (correctAnswers.length === 0) {
        businessLogicErrors.push({
          field: 'options',
          message: 'If options are provided, at least one must be marked as correct'
        });
      }
    }
  }

  // Validate difficulty level against age range
  const { min: minAge, max: maxAge } = value.ageRange;
  if (value.difficultyLevel === 'beginner' && minAge > 8) {
    businessLogicErrors.push({
      field: 'difficultyLevel',
      message: 'Beginner level questions should typically target younger children (age 4-8)'
    });
  } else if (value.difficultyLevel === 'advanced' && maxAge < 8) {
    businessLogicErrors.push({
      field: 'difficultyLevel',
      message: 'Advanced level questions should typically target older children (age 8+)'
    });
  }

  if (businessLogicErrors.length > 0) {
    return {
      isValid: false,
      errors: businessLogicErrors
    };
  }

  return {
    isValid: true,
    data: value
  };
};

// Validation middleware for Express.js
export const validateQuestionMiddleware = (req, res, next) => {
  const validation = validateQuestion(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
  }
  
  req.validatedData = validation.data;
  next();
};

// Schema for updating questions (all fields optional except those that shouldn't change)
export const questionUpdateSchema = questionValidationSchema.fork(
  ['text', 'language', 'type', 'explanation', 'points', 'difficultyLevel', 'ageRange', 'category'],
  (schema) => schema.optional()
);

export const validateQuestionUpdate = (questionData) => {
  const { error, value } = questionUpdateSchema.validate(questionData, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
    };
  }

  return {
    isValid: true,
    data: value
  };
};

// Usage examples:

// Example 1: Basic validation
/*
const questionData = {
  text: "What is the Twi word for 'house'?",
  language: "twi",
  type: "multiple-choice",
  options: [
    { text: "Fi", isCorrect: true },
    { text: "Dan", isCorrect: false },
    { text: "Nkwa", isCorrect: false }
  ],
  explanation: "Fi is the correct Twi word for house",
  points: 5,
  difficultyLevel: "beginner",
  ageRange: { min: 6, max: 10 },
  category: "vocabulary"
};

const result = validateQuestion(questionData);
console.log(result);
*/

// Example 2: Using middleware in Express route
/*
app.post('/api/questions', validateQuestionMiddleware, (req, res) => {
  // req.validatedData contains the clean, validated data
  const question = new QuestionModel(req.validatedData);
  // ... save to database
});
*/