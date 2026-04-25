const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    key:   { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed },
    label: String,
    group: { type: String, default: 'general' },
    type:  { type: String, enum: ['text', 'number', 'bool', 'json'], default: 'text' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', SettingSchema);
