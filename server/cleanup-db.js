import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import User from './models/User.js';
import Board from './models/Board.js';
import Task from './models/Task.js';

// Load environment variables
dotenv.config();

async function cleanupDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();

    console.log('🧹 Starting database cleanup...\n');

    // Count documents before cleanup
    const userCountBefore = await User.countDocuments();
    const boardCountBefore = await Board.countDocuments();
    const taskCountBefore = await Task.countDocuments();

    console.log('📊 Current database state:');
    console.log(`   Users: ${userCountBefore}`);
    console.log(`   Boards: ${boardCountBefore}`);
    console.log(`   Tasks: ${taskCountBefore}\n`);

    // Delete test data (you can customize this based on your test data patterns)
    // For example, delete users with test emails, or boards with test names
    
    // Option 1: Delete all test users (users with 'test' in email)
    const testUsers = await User.find({ 
      email: { $regex: /test/i } 
    });
    
    if (testUsers.length > 0) {
      console.log(`🗑️  Found ${testUsers.length} test user(s) to delete...`);
      const testUserIds = testUsers.map(u => u._id);
      
      // Delete boards owned by test users
      const boardsToDelete = await Board.find({ 
        userId: { $in: testUserIds } 
      });
      
      if (boardsToDelete.length > 0) {
        const boardIds = boardsToDelete.map(b => b._id);
        // Delete tasks associated with these boards
        await Task.deleteMany({ boardId: { $in: boardIds } });
        console.log(`   Deleted ${boardsToDelete.length} board(s) and associated tasks`);
        
        // Delete the boards
        await Board.deleteMany({ _id: { $in: boardIds } });
      }
      
      // Delete test users
      await User.deleteMany({ _id: { $in: testUserIds } });
      console.log(`   Deleted ${testUsers.length} test user(s)\n`);
    }

    // Option 2: Delete boards with test names (optional)
    const testBoards = await Board.find({ 
      name: { $regex: /test|demo|sample/i } 
    });
    
    if (testBoards.length > 0) {
      console.log(`🗑️  Found ${testBoards.length} test board(s) to delete...`);
      const testBoardIds = testBoards.map(b => b._id);
      
      // Delete tasks associated with test boards
      await Task.deleteMany({ boardId: { $in: testBoardIds } });
      console.log(`   Deleted tasks associated with test boards`);
      
      // Delete test boards
      await Board.deleteMany({ _id: { $in: testBoardIds } });
      console.log(`   Deleted ${testBoards.length} test board(s)\n`);
    }

    // Count documents after cleanup
    const userCountAfter = await User.countDocuments();
    const boardCountAfter = await Board.countDocuments();
    const taskCountAfter = await Task.countDocuments();

    console.log('✅ Cleanup completed!\n');
    console.log('📊 Database state after cleanup:');
    console.log(`   Users: ${userCountAfter} (removed ${userCountBefore - userCountAfter})`);
    console.log(`   Boards: ${boardCountAfter} (removed ${boardCountBefore - boardCountAfter})`);
    console.log(`   Tasks: ${taskCountAfter} (removed ${taskCountBefore - taskCountAfter})\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupDatabase();

