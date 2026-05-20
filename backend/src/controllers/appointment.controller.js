const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');

// Compute available slots for a doctor for a given date
const generateSlots = (start, end, slotMinutes) => {
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endM = eh * 60 + em;
  while (cur + slotMinutes <= endM) {
    const sH = String(Math.floor(cur / 60)).padStart(2, '0');
    const sM = String(cur % 60).padStart(2, '0');
    const eTotal = cur + slotMinutes;
    const eH = String(Math.floor(eTotal / 60)).padStart(2, '0');
    const eM = String(eTotal % 60).padStart(2, '0');
    slots.push({ startTime: `${sH}:${sM}`, endTime: `${eH}:${eM}` });
    cur += slotMinutes;
  }
  return slots;
};

exports.setAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.type !== 'doctor') return res.status(403).json({ success: false, message: 'Doctors only' });
    const { startTime, endTime, slotMinutes } = req.body;
    user.availability = {
      startTime: startTime || '09:00',
      endTime: endTime || '17:00',
      slotMinutes: slotMinutes || 30
    };
    await user.save();
    res.json({ success: true, availability: user.availability });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Set availability failed', error: e.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.query; // date ISO yyyy-mm-dd
    const doctor = await User.findById(doctorId || req.user.id);
    if (!doctor || doctor.type !== 'doctor') return res.status(404).json({ success: false, message: 'Doctor not found' });
    const avail = doctor.availability || { startTime: '09:00', endTime: '17:00', slotMinutes: 30 };

    const day = new Date(date);
    day.setHours(0,0,0,0);

    const booked = await Appointment.find({ doctor: doctor._id, date: day, status: { $ne: 'cancelled' } });
    const bookedKey = new Set(booked.map(b => `${b.startTime}-${b.endTime}`));
    const allSlots = generateSlots(avail.startTime, avail.endTime, avail.slotMinutes);
    const available = allSlots.filter(s => !bookedKey.has(`${s.startTime}-${s.endTime}`));

    res.json({ success: true, availability: { ...avail, date: day, slots: available } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Get availability failed', error: e.message });
  }
};

exports.book = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;
    const patientId = req.user.id;
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.type !== 'doctor') return res.status(404).json({ success: false, message: 'Doctor not found' });

    const day = new Date(date);
    day.setHours(0,0,0,0);

    const exists = await Appointment.findOne({ doctor: doctorId, date: day, startTime, endTime, status: { $ne: 'cancelled' } });
    if (exists) return res.status(400).json({ success: false, message: 'Slot unavailable' });

    const appt = await Appointment.create({ doctor: doctorId, patient: patientId, date: day, startTime, endTime });
    res.status(201).json({ success: true, appointment: appt });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Book failed', error: e.message });
  }
};

exports.listForDoctor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'doctor') return res.status(403).json({ success: false, message: 'Doctors only' });
    const { start, end } = req.query; // ISO dates (yyyy-mm-dd)
    const s = new Date(start); s.setHours(0,0,0,0);
    const e = new Date(end); e.setHours(23,59,59,999);
    const appts = await Appointment.find({ doctor: req.user.id, date: { $gte: s, $lte: e } })
      .populate('patient', 'email');
    res.json({ success: true, appointments: appts });
  } catch (e) {
    res.status(500).json({ success: false, message: 'List failed', error: e.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: 'Not found' });
    if (![appt.patient.toString(), appt.doctor.toString()].includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
    appt.status = 'cancelled';
    await appt.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Cancel failed', error: e.message });
  }
};