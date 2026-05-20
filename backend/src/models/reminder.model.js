const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // doctor or caretaker
    title: { type: String, required: true },
    text: { type: String, default: '' },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // HH:mm
    isRecurring: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);