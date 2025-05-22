import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { adminValidationSchema, loginUserValidator, userValidationSchema } from '../Validators/userValidator.js';
import { adminModel, userModel } from '../models/userModel.js';


//REGISTER USER CONTROLLER
export const registerUser = async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = userValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email: value.email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const hashPassword = await bcrypt.hash(value.password, 10);

        // Create new user
        const newUser = await userModel.create({
            ...value,
            email: value.email.toLowerCase(),
            password: hashPassword
        });

        // Generate JWT with expiration
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        // Remove password from response
        const userResponse = { ...newUser.toObject() };
        delete userResponse.password;

        // Send verification email (implementation depends on your email service)
        // await sendVerificationEmail(newUser.email, token);

        res.status(201).json({
            message: 'Welcome to Kasalingo Buddy⭐',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
        next(error)
    }
};

//LOGIN USER CONTROLLER

export const userLogin = async(req, res) => {
const {error, value} = loginUserValidator.validate(req.body)
if (error){
    return res.status(401).json('Login Unsuccessful check credentials')
    
}
 const {userName, password} = value;
 let user, model;

 user = await userModel.findOne({userName});
 if (user) {
    model = userModel;

 }
 if(!user) {
    return res.status(401).json('You are not registered buddy😒')
 };
 const correctPasssword = bcrypt.compareSync(password, user.password);
 if (!correctPasssword){
    return res.status(401).json('Check password buddy might be wrong')
 }

 const token = jwt.sign({ id: user.id},
    process.env.JWT_SECRET, {expiresIn: '24h'}
 );
 res.status(200).json({
    message: 'Starting Learning Buddy😁',
    token,
    user: {
        id: user.id,
        userName: user.userName
    }
 });
}

//REGISTER ADMIN CONTROLLER

export const registerAdmin = async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = adminValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Check if user already exists
        const existingUser = await adminModel.findOne({ email: value.email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const hashPassword = await bcrypt.hash(value.password, 10);

        // Create new user
        const newUser = await adminModel.create({
            ...value,
            email: value.email.toLowerCase(),
            password: hashPassword
        });

        // Generate JWT with expiration
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        // Remove password from response
        const userResponse = { ...newUser.toObject() };
        delete userResponse.password;

        // Send verification email (implementation depends on your email service)
        // await sendVerificationEmail(newUser.email, token);

        res.status(201).json({
            message: 'Welcome to Kasalingo Admnistor⭐',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
        next(error)
    }
};

//LOGIN ADMIN CONTROLLER
export const adminLogin = async(req, res) => {
const {error, value} = loginUserValidator.validate(req.body)
if (error){
    return res.status(401).json('Login Unsuccessful check credentials')
    
}
 const {userName, password} = value;
 let user, model;

 user = await adminModel.findOne({userName});
 if (user) {
    model = adminModel;

 }
 if(!user) {
    return res.status(401).json('You are not registered as admin😒')
 };
 const correctPasssword = bcrypt.compareSync(password, user.password);
 if (!correctPasssword){
    return res.status(401).json('Check password admin might be wrong')
 }

 const token = jwt.sign({ id: user.id},
    process.env.JWT_SECRET, {expiresIn: '24h'}
 );
 res.status(200).json({
    message: 'Welcome to your work space Administrator😁',
    token,
    user: {
        id: user.id,
        userName: user.userName
    }
 });
}
