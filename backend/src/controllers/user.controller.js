const User = require('../models/user.model');
exports.createUser = async (req, res) => {
  try {
    const { email, password, phone, type, doctorInfo, caretakerInfo, patientDetails } = req.body;
    const doctor = await User.findById(req.user.id);
    if (doctor.type !== 'doctor') return res.status(403).json({ success: false, message: 'Doctors only' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email exists' });

    if (!['patient', 'caretaker'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    const userFields = { email, password, phone, type, createdBy: doctor._id };
    if (type === 'patient') {
      userFields.patientDetails = patientDetails;
      userFields.doctor = [{
        doctorDegree: doctor.degree || '',
        doctorName: doctor.name, // || doctor.email,
        doctorphone: doctor.phone || '',
        doctoremail: doctor.email || ''
      }];
    }

    const user = new User(userFields);
    await user.save();

    // If user is a patient, push the patient _id to doctor's assignedPatients array
    if (type === 'patient') {
      doctor.assignedPatients.push(user._id);
      await doctor.save();
    }

    if (type === 'caretaker') {
      doctor.assignedCaretakers.push(user._id);
      await doctor.save();
    }

    res.status(201).json({
      success: true,
      message: `${type} created`,
      user: { id: user._id, email: user.email, phone: user.phone, type: user.type }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Create error', error: error.message });
  }
};

exports.getMyPatients = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id);
    if (doctor.type !== 'doctor') return res.status(403).json({ success: false, message: 'Doctors only' });

    // Find patients whose _id is in doctor's assignedPatients
    const patients = await User.find({ 
      _id: { $in: doctor.assignedPatients },
      type: 'patient'
    })
    .select('-password -resetOTP -resetOTPExpiry')
    .sort({ createdAt: -1 });

    // Optional: If you want caretakers separately
    const caretakers = await User.find({ 
      createdBy: req.user.id,
      type: 'caretaker'
    })
    .select('-password -resetOTP -resetOTPExpiry')
    .sort({ createdAt: -1 });

    res.json({ success: true, patients, caretakers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};


exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -resetOTP -resetOTPExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const requester = await User.findById(req.user.id);
    if (requester.type !== 'doctor' && req.params.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error', error: error.message });
  }
};

// Get logged-in doctor details
exports.getUserEditDetails = async (req, res) => {
  try {

    const user = await User.findById(req.user.id)
    // .select('degree name phone email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return details directly
    res.json({ 
      success: true, 
      user: {
        degree: user.degree || '',
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        patientDetails: user.patientDetails || {}
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch doctor details' });
  }
};

// Update logged-in user details
exports.updateUserDetails = async (req, res) => {
  try {
    const { degree, name, phone, email, patientDetails } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update existing fields directly on the user object
    if (degree !== undefined) user.degree = degree;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    
    if (patientDetails) {
      user.patientDetails = {
        ...(user.patientDetails || {}),
        ...patientDetails
      };
    }

    await user.save();

    res.json({ 
      success: true, 
      message: 'Profile updated successfully', 
      user: {
        degree: user.degree,
        name: user.name,
        phone: user.phone,
        email: user.email,
        patientDetails: user.patientDetails
      } 
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update doctor details' });
  }
};

// Get user full details, including assigned caretakers and patients
exports.assignPatientToCaretaker = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id);
    if (doctor.type !== 'doctor') return res.status(403).json({ success: false, message: 'Doctors only' });
    const { caretakerId, patientId } = req.body;
    const caretaker = await User.findById(caretakerId);
    const patient = await User.findById(patientId);
    if (!caretaker || caretaker.type !== 'caretaker') return res.status(400).json({ success: false, message: 'Invalid caretaker' });
    if (!patient || patient.type !== 'patient') return res.status(400).json({ success: false, message: 'Invalid patient' });

    if (!doctor.assignedCaretakers.some(id => id.toString() === caretakerId)) {
      doctor.assignedCaretakers.push(caretakerId);
    }
    if (!doctor.assignedPatients.some(id => id.toString() === patientId)) {
      doctor.assignedPatients.push(patientId);
    }
    if (!caretaker.assignedPatients.some(id => id.toString() === patientId)) {
      caretaker.assignedPatients.push(patientId);
    }
    await Promise.all([doctor.save(), caretaker.save()]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Assign failed', error: e.message });
  }
};

exports.unassignPatientFromCaretaker = async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id);
    if (doctor.type !== 'doctor') return res.status(403).json({ success: false, message: 'Doctors only' });
    const { caretakerId, patientId } = req.body;
    const caretaker = await User.findById(caretakerId);
    if (!caretaker || caretaker.type !== 'caretaker') return res.status(400).json({ success: false, message: 'Invalid caretaker' });
    caretaker.assignedPatients = caretaker.assignedPatients.filter(p => p.toString() !== patientId);
    doctor.assignedPatients = doctor.assignedPatients.filter(p => p.toString() !== patientId);
    await Promise.all([doctor.save(), caretaker.save()]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Unassign failed', error: e.message });
  }
};

exports.getCaretakerPatients = async (req, res) => {
  try {
    const caretaker = await User.findById(req.user.id);
    if (caretaker.type !== 'caretaker') return res.status(403).json({ success: false, message: 'Caretakers only' });
    const patients = await User.find({ _id: { $in: caretaker.assignedPatients }, type: 'patient' }).select('email phone patientDetails');
    res.json({ success: true, patients });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Fetch failed', error: e.message });
  }
};

exports.getUserFullDetails = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const user = await User.findById(userId)
      .select('-password -resetOTP -resetOTPExpiry')
      .populate('assignedCaretakers', 'email phone caretaker caretakeremail')
      .populate('assignedPatients', 'email phone patientDetails diagnosis')
      .lean();

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.level = user.calculateLevel ? user.calculateLevel() : user.level;

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user details' });
  }
};
