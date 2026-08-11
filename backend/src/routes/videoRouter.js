const express = require('express');
const videoRouter = express.Router();
const problemAdminMiddleware = require("../middleware/problemAdminMiddleware");
const Problem = require("../models/problem");
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const checkVideoLimit = async (req) => {
    if (req.result.role === 'host' || req.result.role === 'starhost') {
        const videoCount = await Problem.countDocuments({ 
            problemCreator: req.result._id, 
            videoLink: { $ne: "", $exists: true } 
        });
        
        if (req.result.role === 'host' && videoCount >= 5) {
            throw new Error("Host limit reached: Cannot upload more than 5 videos.");
        }
        if (req.result.role === 'starhost' && videoCount >= 10) {
            throw new Error("Starhost limit reached: Cannot upload more than 10 videos.");
        }
    }
};

videoRouter.get('/create/:problemId', problemAdminMiddleware, async (req, res) => {
    try {
        const { problemId } = req.params;
        
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).send("Problem not found.");
        }
        
        // Removed authorization check to allow any host to add video to any problem

        // Limit Check
        await checkVideoLimit(req);

        const timestamp = Math.round((new Date).getTime() / 1000);
        const public_id = `video_${problemId}_${timestamp}`;
        
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            public_id: public_id
        }, process.env.CLOUDINARY_API_SECRET);

        res.json({
            signature,
            timestamp,
            public_id,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`
        });
    } catch (err) {
        console.error(err);
        if (err.message.includes("limit reached")) {
            return res.status(403).send(err.message);
        }
        res.status(500).send("Internal server error: " + err.message);
    }
});

videoRouter.post('/create-signature', problemAdminMiddleware, async (req, res) => {
    try {
        const { title } = req.body;
        
        if (title) {
            const problem = await Problem.findOne({ title });
            if (!problem) {
                return res.status(404).send("Problem not found with that title.");
            }
            // Removed ownership check to allow all hosts to upload video to any problem
        }

        // Limit Check
        await checkVideoLimit(req);

        const timestamp = Math.round((new Date).getTime() / 1000);
        const public_id = title ? `video_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}` : `video_host_${timestamp}`;
        
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            public_id: public_id
        }, process.env.CLOUDINARY_API_SECRET);

        res.json({
            signature,
            timestamp,
            public_id,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`
        });
    } catch (err) {
        console.error(err);
        if (err.message.includes("limit reached")) {
            return res.status(403).send(err.message);
        }
        res.status(500).send("Internal server error: " + err.message);
    }
});

videoRouter.post('/save', problemAdminMiddleware, async (req, res) => {
    try {
        const { title, uploadType, cloudinaryPublicId, secureUrl, duration } = req.body;
        
        if (!title) {
            return res.status(400).send("Problem title is required.");
        }

        const problem = await Problem.findOne({ title });
        if (!problem) {
            return res.status(404).send("Problem not found with that title.");
        }
        
        // Removed ownership check to allow all hosts to save video to any problem
        
        // Limit Check (only if overwriting an empty video link)
        if (!problem.videoLink) {
            await checkVideoLimit(req);
        }

        problem.videoLink = secureUrl;

        await problem.save();
        res.status(200).send("Video details saved to problem successfully!");
    } catch (err) {
        console.error(err);
        if (err.message.includes("limit reached")) {
            return res.status(403).send(err.message);
        }
        res.status(500).send("Internal server error: " + err.message);
    }
});

videoRouter.delete('/delete/:id', problemAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const problem = await Problem.findById(id);
        if (!problem) {
            return res.status(404).send("Problem not found");
        }
        
        // Removed authorization check to allow any host to delete videos

        problem.videoLink = "";
        await problem.save();
        res.status(200).send("Video removed successfully");
    } catch (err) {
        res.status(500).send("Internal server error: " + err.message);
    }
});

module.exports = videoRouter;
