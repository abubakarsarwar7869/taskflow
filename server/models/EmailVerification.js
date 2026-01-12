import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    code: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // 10 minutes TTL
    },
});

// Email field already has a unique index via the schema definition
export default mongoose.model('EmailVerification', emailVerificationSchema);
