import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  text: String,
  screenshotUrl: String,
  type: { type: String, enum: ['comment', 'completion'], default: 'comment' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Comment', commentSchema);

