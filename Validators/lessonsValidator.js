import Joi from 'joi';

// Joi validation schema for lessons
const lessonsValidationSchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .messages({
            'string.empty': 'Title cannot be empty',
            'string.min': 'Title must have at least 1 character',
            'string.max': 'Title cannot exceed 200 characters',
            'any.required': 'Title is required'
        }),

    localLanguage: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(500)
        .messages({
            'string.empty': 'Local language text cannot be empty',
            'string.min': 'Local language text must have at least 1 character',
            'string.max': 'Local language text cannot exceed 500 characters',
            'any.required': 'Local language text is required'
        }),

    english: Joi.string()
        .required()
        .min(1)
        .max(500)
        .messages({
            'string.empty': 'English text cannot be empty',
            'string.min': 'English text must have at least 1 character',
            'string.max': 'English text cannot exceed 500 characters',
            'any.required': 'English text is required'
        }),
        pronunciation: Joi.string()
        .required()
        .min(1)
        .max(500)
        .messages({
            'string.empty': 'Pronunciation text cannot be empty',
            'string.min': 'Pronunciation text must have at least 1 character',
            'string.max': 'Pronunciation text cannot exceed 500 characters',
            'any.required': 'Pronunciation text is required'
        }),

    response: Joi.string()
        .required()
        .min(1)
        .max(1000)
        .messages({
            'string.empty': 'Response cannot be empty',
            'string.min': 'Response must have at least 1 character',
            'string.max': 'Response cannot exceed 1000 characters',
            'any.required': 'Response is required'
        }),

    language: Joi.string()
        .required()
        .valid('twi', 'ewe', 'fante', 'ga')
        .messages({
            'any.only': 'Language must be one of: twi, ewe, fante, ga',
            'any.required': 'Please specify language'
        }),

    emoji: Joi.string()
        .required()
        .min(1)
        .max(10)
        .messages({
            'string.empty': 'Emoji cannot be empty',
            'string.min': 'Emoji must have at least 1 character',
            'string.max': 'Emoji cannot exceed 10 characters',
            'any.required': 'Emoji is required'
        })
});

// Validation function
export const validateLesson = (lessonData) => {
    return lessonsValidationSchema.validate(lessonData, { 
        abortEarly: false, // Return all validation errors, not just the first one
        stripUnknown: true // Remove unknown fields
    });
};



export default lessonsValidationSchema;