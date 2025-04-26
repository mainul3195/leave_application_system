import mongoose from 'mongoose';

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Track connection state
let isConnected = false;

/**
 * Connect to MongoDB and cache the connection
 */
async function dbConnect() {
  // If already connected, return immediately
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing database connection');
    return;
  }

  // Reset connection if disconnected or disconnecting
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    console.log('Previous connection closed, reconnecting...');
    isConnected = false;
  }

  try {
    // Use connection options to handle deprecation warnings and improve reliability
    const connectionOptions: mongoose.ConnectOptions = {
      autoCreate: true, // The driver will automatically create the database
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Wait 10 seconds before timing out
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };
    
    console.log('Connecting to MongoDB...');
    
    // Connect to the database
    await mongoose.connect(MONGODB_URI as string, connectionOptions);
    isConnected = true;
    
    // Set up event handlers
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
}

export default dbConnect; 