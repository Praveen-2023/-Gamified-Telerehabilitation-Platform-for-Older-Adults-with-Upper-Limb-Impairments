const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const appointmentController = require('../controllers/appointment.controller');

router.put('/availability', protect, appointmentController.setAvailability);
router.get('/availability', protect, appointmentController.getAvailability);
router.post('/book', protect, appointmentController.book);
router.put('/cancel/:id', protect, appointmentController.cancel);
router.get('/doctor', protect, appointmentController.listForDoctor);

module.exports = router;