const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    fullName:  { type: String, required: true, trim: true },
    username:  { type: String, required: true, unique: true, trim: true, lowercase: true },
    password:  { type: String, required: true, minlength: 6, select: false },
    role:      { type: String, enum: ['admin', 'manager', 'support', 'accountant'], default: 'support' },
    email:     { type: String, trim: true, lowercase: true },
    status:    { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Sign JWT
UserSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = mongoose.model('User', UserSchema);
