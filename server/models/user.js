import mongoose from 'mongoose';
import { ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 60 },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: Object.values(ROLES), required: true },
    },
    { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
    return { id: this.id, name: this.name, email: this.email, role: this.role };
};

export const User = mongoose.model('User', userSchema);
