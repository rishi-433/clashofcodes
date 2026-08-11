const Contest = require('../models/contest');
const Submission = require('../models/submission');

const createContest = async (req, res) => {
    try {
        const { title, description, problems, duration, startTime } = req.body;
        const hostId = req.result._id;
        
        // Admin, host, starhost are allowed (checked in middleware)
        const newContest = await Contest.create({
            title,
            description,
            hostId,
            problems,
            duration,
            startTime
        });
        
        res.status(201).send(newContest);
    } catch (err) {
        res.status(400).send("Error creating contest: " + err.message);
    }
};

const getAllContests = async (req, res) => {
    try {
        const contests = await Contest.find({}).populate('hostId', 'firstName lastName').select('-participants');
        res.status(200).send(contests);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const getContestById = async (req, res) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findById(id).populate('problems', 'title difficulty tags').populate('hostId', 'firstName lastName');
        
        if (!contest) {
            return res.status(404).send("Contest not found");
        }
        
        // Hide problem details if contest hasn't started yet
        const now = new Date();
        const start = new Date(contest.startTime);
        if (now < start) {
            contest.problems = []; // clear problems so they can't be seen before start
        }
        
        res.status(200).send(contest);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const deleteContest = async (req, res) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findById(id);
        
        if (!contest) {
            return res.status(404).send("Contest not found");
        }
        
        // Only admin can delete (middleware ensures this, but let's be safe)
        if (req.result.role !== 'admin') {
            return res.status(403).send("Only admin can delete contests");
        }
        
        await Contest.findByIdAndDelete(id);
        res.status(200).send("Contest deleted successfully");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findById(id).populate('participants.userId', 'firstName lastName emailId');
        
        if (!contest) {
            return res.status(404).send("Contest not found");
        }
        
        // Sort participants by score (descending), then penaltyTime (ascending)
        const leaderboard = contest.participants.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.penaltyTime - b.penaltyTime;
        });
        
        res.status(200).send(leaderboard);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

// Register user to a contest (adds them to participants list if not already there)
const registerContest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.result._id;
        
        const contest = await Contest.findById(id);
        if (!contest) return res.status(404).send("Contest not found");
        
        const isParticipant = contest.participants.find(p => p.userId.toString() === userId.toString());
        if (!isParticipant) {
            contest.participants.push({
                userId,
                score: 0,
                penaltyTime: 0,
                solvedProblems: []
            });
            await contest.save();
        }
        
        res.status(200).send("Registered successfully");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
};

module.exports = {
    createContest,
    getAllContests,
    getContestById,
    deleteContest,
    getLeaderboard,
    registerContest
};
