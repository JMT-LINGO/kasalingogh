import Joi from 'joi';

export const userValidationSchema = Joi.object({
    userName: Joi.string()
        .required()
        .min(3)
        .max(30)
        .trim()
        .messages({
            'string.empty': 'Username is required',
            'string.min': 'Username must be at least {#limit} characters long',
            'string.max': 'Username cannot exceed {#limit} characters'
        }),

    name: Joi.string()
        .max(50)
        .trim()
        .allow('')
        .optional()
        .messages({
            'string.max': 'Name cannot exceed {#limit} characters'
        }),

    email: Joi.string()
        .required()
        .email()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),

    age: Joi.number()
        .integer()
        .min(4)
        .max(16)
        .messages({
            'number.min': 'You must be at least {#limit} years old',
            'number.max': 'Age cannot exceed {#limit} years'
        }),
    password: Joi.string()
        .required(),

    confirmPassword: Joi.string().valid(Joi.ref('password'))
});

export const adminValidationSchema = Joi.object({
    userName: Joi.string().required(),
    email: Joi.string().required().trim().lowercase(),
    password: Joi.string().required(),
    confirmPassword: Joi.string().valid(Joi.ref('password'))
})







// For validating update operations (making fields optional)
export const userUpdateValidationSchema = userValidationSchema.fork(
    ['userName', 'email', 'age', 'password', 'confirmPassword'],
    (schema) => schema.optional()
);


// user login validators
export const loginUserValidator = Joi.object({
    userName:Joi.string().required(),
    password:Joi.string().required(),
});