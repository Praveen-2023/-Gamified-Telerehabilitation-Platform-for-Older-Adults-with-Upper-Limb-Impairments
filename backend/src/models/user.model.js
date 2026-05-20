const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Game-related schemas
const playEntrySchema = new mongoose.Schema({
  responsetime: { type: Number, required: true },
  correct: { type: Number, enum: [-1, 0, 1], required: true }
}, { _id: false });

const gameSessionSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now, required: true },
  levelspan: { type: Number, default: 0 },
  play: [playEntrySchema],
  score: { type: Number, default: 0 },
  reps: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  successes: { type: Number, default: 0 },
  durationSec: { type: Number, default: 0 },
  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  trialLogs: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { _id: false });

const gameTypeSchema = new mongoose.Schema({
  type: { type: String, default: 'type1' },
  name: { type: String, default: 'Reaction Game' },
  eachGameStats: [gameSessionSchema]
}, { _id: false });

// Main User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  type: { type: String, enum: ['doctor', 'patient', 'caretaker'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  currentlevelspan: { type: Number, default: 5 },
  degree: { type: String },
  name: { type: String },

  // Detailed doctor and caretaker info
  doctor: [{
    doctorDegree: { type: String },
    doctorName: { type: String },
    doctorphone: { type: String },
    doctoremail: { type: String }
  }],
  caretaker: [{
    caretakerDegree: { type: String },
    caretakerName: { type: String },
    caretakerphone: { type: String },
    caretakeremail: { type: String }
  }],
  
  // Patient-specific details
  patientDetails: {
    weight: { type: Number },
    height: { type: Number },
    blood: { type: String },
    diagnosis: { type: String }
  },

  // For doctors: a list of their caretakers
  assignedCaretakers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // For caretakers: a list of their assigned patients
  assignedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  game: [gameTypeSchema],
  level: { type: Number, default: 1 },
  totalScore: { type: Number, default: 0 },
  resetOTP: { type: String, default: null },
  resetOTPExpiry: { type: Date, default: null },
isActive: { type: Boolean, default: true },

  // Doctor availability settings
  availability: {
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },
    slotMinutes: { type: Number, default: 30 }
  }
}, { timestamps: true });

// Password hashing and comparison methods (unchanged)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.calculateLevel = function() {
  return Math.floor(this.totalScore / 100) + 1;
};

module.exports = mongoose.model('User', userSchema);
