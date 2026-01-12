import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000,
      bufferCommands: false, // Disable mongoose buffering (OK in v6+)
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('💡 Make sure:');
    console.error('   1. MongoDB is running (local) or connection string is correct (Atlas)');
    console.error('   2. MONGODB_URI is set in your .env file');
    console.error('   3. Network access is configured (for Atlas)');
    console.error('⚠️ Server will continue running, but database operations will fail until MongoDB is connected');
  }
};

export default connectDB;
