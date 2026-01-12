import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  status: { type: String, enum: ['active', 'pending', 'rejected', 'inactive'], default: 'pending' },
  avatar: { type: String, default: '' },
});

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    columns: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        position: { type: Number, default: 0 },
        taskIds: [{ type: String }] // Optional: track task order if needed
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
boardSchema.index({ isPublic: 1, createdAt: -1 });
boardSchema.index({ ownerId: 1, createdAt: -1 });

// Cascade delete tasks when a board is deleted
boardSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const Task = mongoose.model('Task');
    await Task.deleteMany({ boardId: this._id });
    next();
  } catch (err) {
    next(err);
  }
});

const Board = mongoose.model('Board', boardSchema);

export default Board;