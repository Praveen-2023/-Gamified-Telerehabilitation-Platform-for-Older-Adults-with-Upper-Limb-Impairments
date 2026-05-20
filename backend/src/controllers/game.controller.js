const User = require('../models/user.model');

const GAME_TYPES = {
  reaction: 'type1',
  armFruitFetch: 'arm_fruit_fetch'
};

const GAME_NAMES = {
  [GAME_TYPES.reaction]: 'Reaction Game',
  [GAME_TYPES.armFruitFetch]: 'Arm Fruit Fetch'
};

const normalizeGameType = (gameType) => {
  if (gameType === 'arm_fruit_fetch') return GAME_TYPES.armFruitFetch;
  return GAME_TYPES.reaction;
};

const summarizeSession = (session, gameType) => {
  if (gameType === GAME_TYPES.armFruitFetch) {
    const attempts = session.attempts || session.metrics?.attempts || 0;
    const successes = session.successes || session.metrics?.successes || session.reps || 0;
    return {
      correct: successes,
      incorrect: Math.max(attempts - successes, 0),
      notDone: session.metrics?.timeouts || 0,
      responseTimeTotal: session.durationSec || session.metrics?.durationSec || 0,
      validResponseCount: attempts > 0 ? attempts : 0
    };
  }

  return (session.play || []).reduce((acc, entry) => {
    if (entry.correct === 1) {
      acc.correct++;
      if (entry.responsetime !== -1) {
        acc.responseTimeTotal += entry.responsetime;
        acc.validResponseCount++;
      }
    } else if (entry.correct === -1) {
      acc.incorrect++;
      if (entry.responsetime !== -1) {
        acc.responseTimeTotal += entry.responsetime;
        acc.validResponseCount++;
      }
    } else if (entry.correct === 0) {
      acc.notDone++;
    }
    return acc;
  }, { correct: 0, incorrect: 0, notDone: 0, responseTimeTotal: 0, validResponseCount: 0 });
};

// Update level span (editable by doctor and caretaker)
exports.updateLevelSpan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { levelspan } = req.body;
    const requesterId = req.user.id;

    if (!levelspan || levelspan < 1 || levelspan > 10) {
      return res.status(400).json({
        success: false,
        message: 'Level span must be between 1 and 10 seconds'
      });
    }

    const requester = await User.findById(requesterId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only doctor or caretaker can update
    if (requester.type !== 'doctor' && requester.type !== 'caretaker') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors and caretakers can update level span'
      });
    }

    targetUser.currentlevelspan = levelspan;
    await targetUser.save();

    res.json({
      success: true,
      message: 'Level span updated successfully',
      currentlevelspan: targetUser.currentlevelspan
    });
  } catch (error) {
    console.error('Update level span error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating level span',
      error: error.message
    });
  }
};

// Get level span
exports.getLevelSpan = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const user = await User.findById(userId).select('currentlevelspan');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      currentlevelspan: user.currentlevelspan
    });
  } catch (error) {
    console.error('Get level span error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching level span',
      error: error.message
    });
  }
};

// Save game session
exports.saveGameSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      gameType: rawGameType,
      gameName,
      levelspan,
      playData = [],
      metrics = {},
      trialLogs = []
    } = req.body;
    const gameType = normalizeGameType(rawGameType);

    if (!Array.isArray(playData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid play data'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let sessionScore = 0;
    if (gameType === GAME_TYPES.armFruitFetch) {
      sessionScore = Number(metrics.score || 0);
    } else {
      // Calculate score: correct = +10, incorrect = -5, not done = 0
      playData.forEach(entry => {
        if (entry.correct === 1) sessionScore += 10;
        else if (entry.correct === -1) sessionScore -= 5;
      });
    }

    // Ensure sessionScore doesn't go negative
    if (sessionScore < 0) sessionScore = 0;

    const newSession = {
      time: new Date(),
      levelspan: levelspan || 0,
      play: playData,
      score: sessionScore,
      reps: Number(metrics.reps || 0),
      attempts: Number(metrics.attempts || 0),
      successes: Number(metrics.successes || metrics.reps || 0),
      durationSec: Number(metrics.durationSec || 0),
      metrics,
      trialLogs
    };

    // Find or create game type
    let game = user.game.find(g => g.type === gameType);

    if (!game) {
      user.game.push({
        type: gameType,
        name: gameName || GAME_NAMES[gameType],
        eachGameStats: [newSession]
      });
    } else {
      game.name = gameName || game.name || GAME_NAMES[gameType];
      game.eachGameStats.push(newSession);
    }

    user.totalScore += sessionScore;
    user.level = user.calculateLevel();

    await user.save();

    res.json({
      success: true,
      message: 'Game session saved successfully',
      sessionScore,
      totalScore: user.totalScore,
      level: user.level
    });
  } catch (error) {
    console.error('Save session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving game session',
      error: error.message
    });
  }
};

// Get detailed analytics (for doctors only)
exports.getDetailedAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestedGameType = normalizeGameType(req.query.gameType);
    const requesterId = req.user.id;

    const requester = await User.findById(requesterId);

    if (requester.type !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can view detailed analytics'
      });
    }

    const user = await User.findById(userId).select('-password -resetOTP -resetOTPExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gameSummaries = (user.game || []).map(game => ({
      type: game.type,
      name: game.name || GAME_NAMES[game.type] || game.type,
      totalSessions: game.eachGameStats?.length || 0
    }));

    // Get game stats
    const game = user.game.find(g => g.type === requestedGameType);
    const sessions = game ? game.eachGameStats : [];

    // Calculate overall statistics
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalNotDone = 0;
    let totalResponseTime = 0;
    let validResponseCount = 0;

    sessions.forEach(session => {
      const summary = summarizeSession(session, requestedGameType);
      totalCorrect += summary.correct;
      totalIncorrect += summary.incorrect;
      totalNotDone += summary.notDone;
      totalResponseTime += summary.responseTimeTotal;
      validResponseCount += summary.validResponseCount;
    });

    const avgResponseTime = validResponseCount > 0 
      ? (totalResponseTime / validResponseCount).toFixed(2)
      : 0;

    const accuracy = (totalCorrect + totalIncorrect) > 0
      ? ((totalCorrect / (totalCorrect + totalIncorrect)) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      analytics: {
        user: {
          email: user.email,
          type: user.type,
          totalScore: user.totalScore,
          level: user.level,
          currentlevelspan: user.currentlevelspan
        },
        overallStats: {
          gameType: requestedGameType,
          gameName: game?.name || GAME_NAMES[requestedGameType],
          totalSessions: sessions.length,
          totalCorrect,
          totalIncorrect,
          totalNotDone,
          avgResponseTime: parseFloat(avgResponseTime),
          accuracy: parseFloat(accuracy)
        },
        sessions: sessions.slice(-10), // Last 10 sessions
        gameSummaries
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Get basic stats (for patients and caretakers)
exports.getBasicStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const requestedGameType = normalizeGameType(req.query.gameType);

    const user = await User.findById(userId).select('email type totalScore level currentlevelspan game');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const gameType = user.game.find(g => g.type === requestedGameType);
    const sessions = gameType ? gameType.eachGameStats.slice(-30) : [];

    const basicSessions = sessions.map(session => {
      const summary = summarizeSession(session, requestedGameType);

      const correct = summary.correct;
      const incorrect = summary.incorrect;
      const notDone = summary.notDone;
      const responsetime = summary.responseTimeTotal;

      return {
        session: session,
        time: session.time,
        correct,
        incorrect,
        responsetime,
        notDone,
        total: requestedGameType === GAME_TYPES.armFruitFetch
          ? session.attempts || session.metrics?.attempts || correct + incorrect + notDone
          : session.play.length,
      };
    });

    res.json({
      success: true,
      stats: {
        email: user.email,
        type: user.type,
        totalScore: user.totalScore,
        level: user.level,
        currentlevelspan: user.currentlevelspan,
        gameType: requestedGameType,
        gameName: gameType?.name || GAME_NAMES[requestedGameType],
        // responsetime,
        recentSessions: basicSessions,
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
