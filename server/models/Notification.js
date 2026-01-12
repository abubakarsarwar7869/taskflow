import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['board_created', 'task_created', 'task_deadline', 'board_invite', 'task_moved', 'task_deleted', 'added_to_board', 'member_removed', 'member_left', 'comment_added', 'role_changed', 'mention'],
            required: true,
        },
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
