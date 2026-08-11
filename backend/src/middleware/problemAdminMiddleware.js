const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")

const problemAdminMiddleware = async (req,res,next)=>{
    try{
        const {token} = req.cookies;
        if(!token)
            throw new Error("Token is not persent");

        const payload = jwt.verify(token,process.env.JWT_KEY);
        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if(!result){
            throw new Error("User Doesn't Exist");
        }

        if(!['admin', 'starhost', 'host'].includes(result.role)){
            console.error(`Invalid role: ${result.role}`);
            throw new Error(`Invalid Token: Role '${result.role}' is not allowed`);
        }

        // Redis ke blockList mein persent toh nahi hai
        const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            throw new Error("Invalid Token");

        req.result = result;

        next();
    }
    catch(err){
        console.error("Middleware Error:", err.message);
        res.status(401).json({ message: err.message });
    }
}

module.exports = problemAdminMiddleware;
