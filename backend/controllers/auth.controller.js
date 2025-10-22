import {redis} from "../lib/redis.js"
import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

const generateTokens = (userId)=>{
    const accessToken = jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:"15m"})
    const refreshToken = jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:"7d"})
    return {accessToken,refreshToken}
}

const storeRefreshTokenInRedis = async (userId, refreshToken) => {
    // Implement the logic to store the refresh token in Redis
    await redis.set(`refreshToken:${userId}`, refreshToken, 
        "EX", 7 * 24 * 60 * 60 // Set expiration time to 7 days
    );
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
}

export const signup = async (req, res) => {
     console.log("Signup endpoint hit:", req.body)
   const {name,email,password} = req.body
   try{
    const userExist = await User.findOne({email})
    if(userExist){
        return res.status(400).json({message:"User already exist"})
    }
    const user = await User.create({name,email,password})
      // authenticate user
      const {accessToken,refreshToken} = generateTokens(user._id)
      await storeRefreshTokenInRedis(user._id, refreshToken);
      setCookies(res, accessToken, refreshToken);

    res.status(201).json({user:{
      _id:user._id,
      name:user.name,
      email:user.email,
      role:user.role
    },message:"User created successfully"})
   }catch(error){
    console.log("Signup error:", error.message)
    res.status(500).json({message: error.message})
}
}





export const login = async (req, res) => {
   try {
     const {email,password} = req.body
     const user  = await User.findOne({email})
     if(user&& await user.comparePassword(password)){

      const {accessToken,refreshToken} = generateTokens(user._id)
        await storeRefreshTokenInRedis(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);
        res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			});
            
        
     }else{
                res.status(401).json({message:"Invalid email or password"})
            }
        
   } catch (error) {
    res.status(500).json({message:"Something went wrong",error: error.message})
   }

}
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refreshToken:${decoded.userId}`);
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(200).json({message: "Logged out successfully"});
    } catch (error) {
        res.status(500).json({message: "Something went wrong", error: error.message});
    }
    
}

export const refreshToken = async (req,res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) {
            return res.status(401).json({message: "No refresh token provided"});
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`);
        if(storedToken !== refreshToken) {
            return res.status(401).json({message: "Invalid refresh token"});
        }
        const accessToken = jwt.sign({userId: decoded.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15m"});
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });
        res.json({message: "Access token refreshed"});
        
    } catch (error) {
        res.status(500).json({message: "Something went wrong", error: error.message});
    }
}

export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};