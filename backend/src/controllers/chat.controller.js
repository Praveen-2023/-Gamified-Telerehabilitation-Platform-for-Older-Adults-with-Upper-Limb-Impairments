const Chat = require('../models/chat.model');
const User = require('../models/user.model');

// Ensure a chat exists (or create) for participants/type
exports.ensureChat = async (req, res) => {
  try {
    const { participantIds, type } = req.body; // array of userIds including requester or not
    const requesterId = req.user.id;
    const ids = Array.from(new Set([requesterId, ...participantIds]));

    // Permission checks
    const users = await User.find({ _id: { $in: ids } });
    const me = users.find(u => u._id.toString() === requesterId);
    if (!me) return res.status(400).json({ success: false, message: 'Invalid requester' });

    if (type === 'caretaker-patient') {
      const caretaker = users.find(u => u.type === 'caretaker');
      const patient = users.find(u => u.type === 'patient');
      if (!caretaker || !patient) return res.status(400).json({ success: false, message: 'Need caretaker and patient' });
      // caretaker must be assigned to patient
      if (!caretaker.assignedPatients?.some(p => p.toString() === patient._id.toString())) {
        return res.status(403).json({ success: false, message: 'Caretaker not assigned to patient' });
      }
    }

    // doctor-patient / doctor-caretaker are allowed if a doctor is participant
    if ((type === 'doctor-patient' || type === 'doctor-caretaker') && !users.some(u => u.type === 'doctor')) {
      return res.status(400).json({ success: false, message: 'A doctor must be a participant' });
    }

    let chat = await Chat.findOne({
      type,
      participants: { $all: ids, $size: ids.length }
    });

    if (!chat) {
      chat = await Chat.create({ participants: ids, type, messages: [] });
    }

    res.json({ success: true, chat });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Ensure chat failed', error: e.message });
  }
};

exports.listMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('participants', 'email type name');
    res.json({ success: true, chats });
  } catch (e) {
    res.status(500).json({ success: false, message: 'List chats failed', error: e.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    if (!chat.participants.map(p=>p.toString()).includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }
    chat.messages.push({ sender: req.user.id, text });
    await chat.save();
    res.json({ success: true, chat });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Send failed', error: e.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).populate('messages.sender', 'email type name');
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    if (!chat.participants.map(p=>p.toString()).includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }
    res.json({ success: true, messages: chat.messages });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Fetch failed', error: e.message });
  }
};