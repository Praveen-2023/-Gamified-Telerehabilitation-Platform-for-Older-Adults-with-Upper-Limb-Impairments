const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const reminderController = require('../controllers/reminder.controller');

router.post('/', protect, reminderController.create);
router.get('/:patientId?', protect, reminderController.listForPatient);
router.put('/complete/:id', protect, reminderController.complete);
router.put('/:id', protect, reminderController.update);

module.exports = router;