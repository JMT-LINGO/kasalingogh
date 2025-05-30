import Joi from 'joi';

const storyValidationSchema = Joi.object({
    title: Joi.object({
        local: Joi.string()
            .required()
            .trim()
            .min(1)
            .max(200)
            .messages({
                'string.empty': 'Local language title is required',
                'any.required': 'Local language title is required'
            }),
        english: Joi.string()
            .required()
            .trim()
            .min(1)
            .max(200)
            .messages({
                'string.empty': 'English title is required',
                'any.required': 'English title is required'
            })
    }).required(),

    content: Joi.object({
        local: Joi.string()
            .required()
            .min(1)
            .messages({
                'string.empty': 'Local language content is required',
                'any.required': 'Local language content is required'
            }),
        english: Joi.string()
            .required()
            .min(1)
            .messages({
                'string.empty': 'English content is required',
                'any.required': 'English content is required'
            })
    }).required(),

    language: Joi.string()
        .valid('twi', 'ga', 'ewe', 'fante')
        .required()
        .messages({
            'any.only': 'Language must be one of: twi, ga, ewe, fante',
            'any.required': 'Language is required'
        }),

    image: Joi.string()
        .uri()
        .optional()
        .allow('')
        .messages({
            'string.uri': 'Image must be a valid URL'
        }),

    difficultyLevel: Joi.string()
        .valid('beginner', 'intermediate', 'advanced')
        .required()
        .messages({
            'any.only': 'Difficulty level must be one of: beginner, intermediate, advanced',
            'any.required': 'Difficulty level is required'
        }),

    isRead: Joi.boolean()
        .default(false)
        .optional(),

    vocabulary: Joi.array()
        .items(
            Joi.object({
                local: Joi.string().required(),
                english: Joi.string().required(),
                pronunciation: Joi.string().optional()
            })
        )
        .optional(),

    audioUrl: Joi.object({
        local: Joi.string().uri().optional(),
        english: Joi.string().uri().optional()
    }).optional(),

    category: Joi.string()
        .valid('folktale', 'adventure', 'moral', 'historical', 'daily-life', 'fantasy')
        .optional()
});

export const validateStory = (storyData) => {
    return storyValidationSchema.validate(storyData, {
        abortEarly: false,
        allowUnknown: false
    });
};

// Update schema for PATCH operations
export const updateStorySchema = Joi.object({
    title: Joi.object({
        local: Joi.string().trim().min(1).max(200).optional(),
        english: Joi.string().trim().min(1).max(200).optional()
    }).optional(),

    content: Joi.object({
        local: Joi.string().min(1).optional(),
        english: Joi.string().min(1).optional()
    }).optional(),

    language: Joi.string().valid('twi', 'ga', 'ewe', 'fante').optional(),
    image: Joi.string().uri().optional().allow(''),
    difficultyLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    isRead: Joi.boolean().optional(),
    vocabulary: Joi.array().items(
        Joi.object({
            local: Joi.string().required(),
            english: Joi.string().required(),
            pronunciation: Joi.string().optional()
        })
    ).optional(),
    audioUrl: Joi.object({
        local: Joi.string().uri().optional(),
        english: Joi.string().uri().optional()
    }).optional(),
    category: Joi.string().valid('folktale', 'adventure', 'moral', 'historical', 'daily-life', 'fantasy').optional()
}).min(1);
