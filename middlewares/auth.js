import { expressjwt } from 'express-jwt';
import jwt from 'jsonwebtoken';
import { adminModel } from '../models/userModel.js';

export const isAuthenticated = expressjwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    requestProperty: "auth"
});


// Middleware to verify admin authentication
export const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await adminModel.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};