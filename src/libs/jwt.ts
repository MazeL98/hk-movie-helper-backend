import jwt from "jsonwebtoken"
import { ENV_CONFIG } from "../config/config.default"


const ACCESS_TOKEN_SECRET = ENV_CONFIG.JWT_SECRET as string;
const REFRESH_TOKEN_SECRET = ENV_CONFIG.JWT_REFRESH_SECRET as string;

// 生成Token 
export const generateAccessToken = (payload:any) =>{
  return jwt.sign(payload,ACCESS_TOKEN_SECRET,{expiresIn:'2h'})
}

export const generateRefreshToken = (payload:any) =>{
  return jwt.sign(payload,REFRESH_TOKEN_SECRET,{expiresIn:'7d'});
}


// 校验Token
export const verifyAccessToken = (token:string) =>{
  return jwt.verify(token,ACCESS_TOKEN_SECRET)
}

export const verifyRefreshToken = (token:string) =>{
  return jwt.verify(token,REFRESH_TOKEN_SECRET)
}

