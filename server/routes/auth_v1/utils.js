import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../../config/env.js';

// Generate JWT Token
export const generateToken = (id) => {
  if (!JWT_CONFIG.SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
  });
};

