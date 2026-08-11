const { Queue, Worker } = require('bullmq');
const redisClient = require('./redis');
const { getIo } = require('./socket');
const Submission = require('../models/submission');
const Problem = require('../models/problem');
const Contest = require('../models/contest');
const User = require('../models/user');
const { getLanguageById, submitBatch, submitToken } = require('../utils/problemUtility');

const submissionQueue = new Queue('submissionQueue', { connection: redisClient });

const worker = new Worker('submissionQueue', async (job) => {
    const { submissionId, problemId, userId, code, language, contestId } = job.data;
    const now = new Date();
    
    try {
        const problem = await Problem.findById(problemId);
        const languageId = getLanguageById(language);
        
        const submissions = problem.hiddenTestCases.map((testcase) => ({
            source_code: Buffer.from(code).toString('base64'),
            language_id: languageId,
            stdin: Buffer.from(testcase.input).toString('base64'),
            expected_output: Buffer.from(testcase.output).toString('base64')
        }));

        const submitResult = await submitBatch(submissions, true);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken, true);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'accepted';
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id == 3) {
                testCasesPassed++;
                runtime += parseFloat(test.time || 0);
                memory = Math.max(memory, test.memory || 0);
            } else {
                if (test.status_id == 4) {
                    status = 'error';
                    errorMessage = test.stderr ? Buffer.from(test.stderr, 'base64').toString('utf8') : (test.compile_output ? Buffer.from(test.compile_output, 'base64').toString('utf8') : null);
                } else {
                    status = 'wrong';
                    errorMessage = test.stderr ? Buffer.from(test.stderr, 'base64').toString('utf8') : (test.compile_output ? Buffer.from(test.compile_output, 'base64').toString('utf8') : null);
                }
            }
        }

        const submittedResult = await Submission.findById(submissionId);
        if (submittedResult) {
            submittedResult.status = status;
            submittedResult.testCasesPassed = testCasesPassed;
            submittedResult.errorMessage = errorMessage;
            submittedResult.runtime = runtime;
            submittedResult.memory = memory;
            await submittedResult.save();
        }

        // Add to user solved list
        const user = await User.findById(userId);
        if (user && status === 'accepted' && !user.problemSolved.includes(problemId)) {
            user.problemSolved.push(problemId);
            await user.save();
        }

        // Contest leaderboard logic
        let isLeaderboardUpdated = false;
        if (contestId) {
            const contest = await Contest.findById(contestId);
            if (contest) {
                let participant = contest.participants.find(p => p.userId.toString() === userId.toString());
                
                // Auto-register user if they haven't explicitly registered
                if (!participant) {
                    contest.participants.push({
                        userId: userId,
                        score: 0,
                        penaltyTime: 0,
                        solvedProblems: []
                    });
                    participant = contest.participants[contest.participants.length - 1];
                }

                if (!participant.solvedProblems.includes(problemId)) {
                    const contestStart = new Date(contest.startTime);
                    const minutesSinceStart = Math.floor((now.getTime() - contestStart.getTime()) / 60000);
                    
                    if (status === 'accepted') {
                        participant.score += 1;
                        participant.penaltyTime += Math.max(0, minutesSinceStart);
                        participant.solvedProblems.push(problemId);
                    } else {
                        participant.penaltyTime += 5; // 5 min penalty
                    }
                    await contest.save();
                    isLeaderboardUpdated = true;
                }
            }
        }

        // Emit result to the user
        try {
            const io = getIo();
            const resultData = {
                submissionId,
                accepted: (status === 'accepted'),
                totalTestCases: problem.hiddenTestCases.length,
                passedTestCases: testCasesPassed,
                runtime,
                memory,
                error: errorMessage,
                status: status
            };
            io.to(userId.toString()).emit('submissionResult', resultData);

            if (isLeaderboardUpdated) {
                io.to(`contest_${contestId}`).emit('leaderboardUpdate', { contestId });
            }
        } catch (ioErr) {
            console.error("Socket emit error:", ioErr);
        }

    } catch (error) {
        console.error("Job Error: ", error);
        try {
            const submittedResult = await Submission.findById(submissionId);
            if (submittedResult) {
                submittedResult.status = 'error';
                submittedResult.errorMessage = error.toString();
                await submittedResult.save();
                const io = getIo();
                io.to(userId.toString()).emit('submissionResult', {
                    submissionId,
                    accepted: false,
                    error: "Internal Processing Error",
                    status: 'error'
                });
            }
        } catch(e) {}
    }
}, { connection: redisClient });

module.exports = { submissionQueue };
