const express = require('express');
const router = express.Router();
const userAuth = require('../middleware/userMiddleware');
const problemAdminAuth = require('../middleware/problemAdminMiddleware');
const adminAuth = require('../middleware/adminMiddleware');
const { createContest, getAllContests, getContestById, deleteContest, getLeaderboard, registerContest } = require('../controllers/contestController');

// Public routes (require auth to view details, but any user can view list)
router.get('/all', userAuth, getAllContests);
router.get('/:id', userAuth, getContestById);
router.get('/:id/leaderboard', userAuth, getLeaderboard);
router.post('/:id/register', userAuth, registerContest);

// Host/Starhost routes for creating contests
router.post('/create', userAuth, problemAdminAuth, createContest);

// Admin route for deleting contests
router.delete('/:id', userAuth, adminAuth, deleteContest);

module.exports = router;
