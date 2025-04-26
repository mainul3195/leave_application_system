import mongoose from 'mongoose';

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

let isConnected = false;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let globalWithMongoose = global as typeof globalThis & {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (isConnected) {
    return;
  }

  try {
    // Use connection options to handle deprecation warnings
    const connectionOptions: mongoose.ConnectOptions = {
      // The driver will automatically try to reconnect
      autoCreate: true,
      maxPoolSize: 10
    };
    
    await mongoose.connect(MONGODB_URI as string, connectionOptions);
    
    isConnected = true;
    
    // Set event handlers without logging
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
    });
    
    mongoose.connection.on('error', () => {
      isConnected = false;
    });
    
  } catch (error) {
    throw error;
  }
}

export default dbConnect; 