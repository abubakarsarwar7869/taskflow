import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_CONFIG } from '../config/env.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
      if (!JWT_CONFIG.SECRET) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      // Verify token
      const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ error: 'User not found' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};



