import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId }, // Added to help with mapping if needed
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  userName: String,
  text: String,
  screenshotUrl: String,
  type: { type: String, enum: ['comment', 'completion'], default: 'comment' },
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better query performance
commentSchema.index({ taskId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });

export default mongoose.model('Comment', commentSchema);

