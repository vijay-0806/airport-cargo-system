import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'airport-cargo-jwt-super-secret-key-college-demo-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_TTL_SECONDS: process.env.REDIS_TTL_SECONDS ? parseInt(process.env.REDIS_TTL_SECONDS, 10) : 120,
};
