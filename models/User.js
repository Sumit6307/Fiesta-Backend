import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: { type: String },
    resetTokenExpiration: { type: Date },
    isVerified: { type: Boolean, default: false },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }], // Array of favorite hotel IDs
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;