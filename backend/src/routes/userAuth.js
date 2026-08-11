const express = require('express');

const authRouter =  express.Router();
const {sendOtp, register, login,logout, adminRegister,deleteProfile, getAllUsers, changeUserRole, deleteUserAdmin} = require('../controllers/userAuthent')
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');

// Register
authRouter.post('/send-otp', sendOtp);
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware ,adminRegister);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);

authRouter.get('/admin/users', adminMiddleware, getAllUsers);
authRouter.patch('/admin/users/:id/role', adminMiddleware, changeUserRole);
authRouter.delete('/admin/users/:id', adminMiddleware, deleteUserAdmin);

authRouter.get('/check',userMiddleware,(req,res)=>{

    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id:req.result._id,
        role:req.result.role,
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
})
// authRouter.get('/getProfile',getProfile);


module.exports = authRouter;

// login
// logout
// GetProfile

