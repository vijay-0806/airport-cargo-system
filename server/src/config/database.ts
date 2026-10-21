import mongoose from 'mongoose';
import { ENV } from './env.ts';

let isMongooseConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (!ENV.MONGODB_URI || ENV.MONGODB_URI.trim() === '') {
    console.log('[Database] MONGODB_URI not configured. Operating in high-performance embedded in-memory database mode.');
    return false;
  }

  try {
    console.log('[Database] Connecting to MongoDB Atlas / Server...');
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    isMongooseConnected = true;
    console.log('[Database] Successfully connected to MongoDB.');
    return true;
  } catch (error: any) {
    console.warn('[Database] Failed to connect to MongoDB, falling back to embedded database store:', error.message);
    isMongooseConnected = false;
    return false;
  }
}

export function isConnectedToMongoDB(): boolean {
  return isMongooseConnected && mongoose.connection.readyState === 1;
}
