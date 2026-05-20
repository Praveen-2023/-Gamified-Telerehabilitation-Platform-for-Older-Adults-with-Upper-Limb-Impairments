const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // date only (set to midnight)
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
    status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);