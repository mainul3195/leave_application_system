import mongoose from 'mongoose';

// Keep empty interface for future extensions
declare global {
  // Define the global mongoose type for connection caching
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
} 