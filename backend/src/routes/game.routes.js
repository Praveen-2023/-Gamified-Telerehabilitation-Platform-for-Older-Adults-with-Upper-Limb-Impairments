const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/save-session', protect, gameController.saveGameSession);
router.get('/levelspan/:userId?', protect, gameController.getLevelSpan);
router.put('/levelspan/:userId', protect, gameController.updateLevelSpan);
router.get('/analytics/:userId', protect, gameController.getDetailedAnalytics);
router.get('/stats/:userId?', protect, gameController.getBasicStats);

module.exports = router;
