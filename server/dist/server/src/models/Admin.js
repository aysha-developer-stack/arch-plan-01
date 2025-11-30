import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
const AdminSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
// Hash password before saving
AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});
// Password comparison method
AdminSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
export default mongoose.model('Admin', AdminSchema);
//# sourceMappingURL=Admin.js.map