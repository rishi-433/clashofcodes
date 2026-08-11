const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission");
const { sendOtpEmail } = require("../utils/mailSender");


const sendOtp = async (req, res) => {
    try {
        const { emailId } = req.body;
        if (!emailId) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in Redis with a 60-second TTL
        await redisClient.setEx(`otp:${emailId}`, 60, otp);

        // Send the OTP via email
        await sendOtpEmail(emailId, otp);

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
};

const register = async (req,res)=>{
    
    try{
        // validate the data;

      validate(req.body); 
      const {firstName, emailId, password, otp}  = req.body;

      if (!otp) {
          return res.status(400).json({ message: "OTP is required" });
      }

      // Verify OTP
      const storedOtp = await redisClient.get(`otp:${emailId}`);
      if (!storedOtp) {
          return res.status(400).json({ message: "OTP has expired or does not exist. Please request a new one." });
      }
      
      if (storedOtp !== otp) {
          return res.status(400).json({ message: "Invalid OTP" });
      }

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
    //
    
     const user =  await User.create(req.body);

     // Delete OTP after successful registration
     await redisClient.del(`otp:${emailId}`);

     const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
     const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role:user.role,
    }
    
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).json({
        user:reply,
        message:"Loggin Successfully"
    })
    }
    catch(err){
        console.error("Registration error:", err);
        // Extract the error message string if it's an Error object
        const errorMsg = err.message || err.toString();
        res.status(400).json({ message: errorMsg.replace('Error: ', '') });
    }
}


const login = async (req,res)=>{

    try{
        const {emailId, password} = req.body;

        if(!emailId)
            throw new Error("Invalid Credentials");
        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailId});

        const match = bcrypt.compare(password,user.password);

        if(!match)
            throw new Error("Invalid Credentials");

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role:user.role,
        }

        const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,{maxAge: 60*60*1000});
        res.status(201).json({
            user:reply,
            message:"Loggin Successfully"
        })
    }
    catch(err){
        res.status(401).send("Error: "+err);
    }
}


// logOut feature

const logout = async(req,res)=>{

    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    res.cookie("token",null,{expires: new Date(Date.now())});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'firstName emailId role _id');
        res.status(200).json(users);
    } catch(err) {
        res.status(500).json({message: "Internal Server Error"});
    }
};

const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['user', 'admin', 'host', 'starhost'].includes(role)) {
            return res.status(400).json({message: "Invalid role"});
        }
        await User.findByIdAndUpdate(id, { role });
        res.status(200).json({message: "Role updated successfully"});
    } catch(err) {
        res.status(500).json({message: "Internal Server Error"});
    }
};

const deleteUserAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({message: "User deleted successfully"});
    } catch(err) {
        res.status(500).json({message: "Internal Server Error"});
    }
};

module.exports = {sendOtp, register, login,logout,adminRegister,deleteProfile, getAllUsers, changeUserRole, deleteUserAdmin};