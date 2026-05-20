const Reminder = require('../models/reminder.model');
const User = require('../models/user.model');

const ensureCanManagePatient = async (requesterId, patientId) => {
  const requester = await User.findById(requesterId);
  if (!requester) return false;
  if (requester.type === 'doctor') return true;
  if (requester.type === 'caretaker') {
    return requester.assignedPatients?.some(p => p.toString() === patientId.toString());
  }
  return requesterId.toString() === patientId.toString();
};

exports.create = async (req, res) => {
  try {
    const { patientId, title, text, date, time, isRecurring } = req.body;
    if (!(await ensureCanManagePatient(req.user.id, patientId))) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
    const reminder = await Reminder.create({
      patient: patientId,
      createdBy: req.user.id,
      title,
      text,
      date,
      time,
      isRecurring: !!isRecurring
    });
    res.status(201).json({ success: true, reminder });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Create reminder failed', error: e.message });
  }
};

exports.listForPatient = async (req, res) => {
  try {
    const patientId = req.params.patientId || req.user.id;
    if (!(await ensureCanManagePatient(req.user.id, patientId))) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
    const reminders = await Reminder.find({ patient: patientId }).sort({ date: 1, time: 1 });
    res.json({ success: true, reminders });
  } catch (e) {
    res.status(500).json({ success: false, message: 'List reminders failed', error: e.message });
  }
};

exports.complete = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findById(id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });
    if (!(await ensureCanManagePatient(req.user.id, reminder.patient))) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
    reminder.status = 'completed';
    await reminder.save();

    // Auto-generate next instance if recurring
    if (reminder.isRecurring) {
      // Create for "tomorrow" relative to today to ensure the chain never breaks
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);

      // Check if next occurrence already exists
      const existingNext = await Reminder.findOne({
        patient: reminder.patient,
        title: reminder.title,
        date: {
          $gte: new Date(nextDate.getTime()),
          $lt: new Date(nextDate.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (!existingNext) {
        await Reminder.create({
          patient: reminder.patient,
          createdBy: reminder.createdBy,
          title: reminder.title,
          text: reminder.text,
          date: nextDate,
          time: reminder.time,
          isRecurring: true,
          status: 'active'
        });
      }
    }


    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Complete failed', error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findById(id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });
    if (!(await ensureCanManagePatient(req.user.id, reminder.patient))) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
    
    const { title, text, date, time, isRecurring, status } = req.body;
    if (title) reminder.title = title;
    if (text !== undefined) reminder.text = text;
    if (date) reminder.date = date;
    if (time) reminder.time = time;
    if (isRecurring !== undefined) reminder.isRecurring = !!isRecurring;
    if (status) reminder.status = status;

    await reminder.save();
    res.json({ success: true, reminder });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Update failed', error: e.message });
  }
};