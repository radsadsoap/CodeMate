import mongoose from 'mongoose';
import { LANGUAGES } from '../utils/constants.js';

const { ObjectId } = mongoose.Schema.Types;

const codeSnapshot = Object.fromEntries(LANGUAGES.map((language) => [language, String]));

const sessionSchema = new mongoose.Schema(
    {
        roomId: { type: String, required: true, unique: true },
        title: { type: String, required: true, trim: true, maxlength: 80 },
        language: { type: String, enum: LANGUAGES, default: 'python' },
        createdBy: { type: ObjectId, ref: 'User', required: true },
        participants: [{ type: ObjectId, ref: 'User' }],
        isActive: { type: Boolean, default: true },
        endedAt: { type: Date },
        editLocked: { type: Boolean, default: false },
        editors: [{ type: ObjectId, ref: 'User' }],
        // Encoded Yjs document: the source of truth while the session is live.
        docState: { type: Buffer, select: false },
        // Plain-text copy per language for ended sessions and previews.
        code: codeSnapshot,
    },
    { timestamps: true }
);

sessionSchema.index({ participants: 1, createdAt: -1 });

export const Session = mongoose.model('Session', sessionSchema);
