import  Router from '@koa/router'
import {getUser,createUser} from "../../controller/user.controller"
import { ENV_CONFIG } from '../../config/config.default'

import bcrypt from "bcrypt"
import authMiddleware from '../../middlewares/auth'
import {generateAccessToken,generateRefreshToken, verifyRefreshToken} from "../../libs/jwt"
const useRouter = new Router({
  prefix: '/api/user'
})



// 用户注册
useRouter.post('/register', async(ctx :any)  => {
  const {username,email,password} = ctx.request.body 
  if(!username || !email || !password) {
    ctx.throw(400,'缺少必要项')
  }
  // 检查用户是否已存在
  const existed = await getUser({email})
   if (existed) {
    ctx.throw(400, "该邮箱已被注册");
  }
  const result = await createUser({username,email,password})
  if(result){
    ctx.body=result
  } else {
    ctx.status = 200;
    ctx.body = {message: "创建失败，请稍后重试"}
  }
})


// 用户登录
useRouter.post('/login',async(ctx:any) =>{
  const {email,password} = ctx.request.body;
  if(!email || !password) {
    ctx.throw(400,"缺少必要项")
  }

  const user = await getUser({email})
  if(!user) {
    ctx.throw(401,"邮箱或密码错误")
    return;
  }
  const match =await bcrypt.compare(password,user?.passwordHash as string)
  if(!match) {
    ctx.throw(401,"密码错误，请重试")
    return;
  }
  const accessToken = generateAccessToken({id:user?.id,email:user?.email})
  const refreshToken = generateRefreshToken({id:user?.id,email:user?.email})
  ctx.cookies.set("refreshToken",refreshToken,{
    httpOnly:true,
    secure:process.env.NODE_ENV === 'production',
    sameSite: "strict",
    maxAge: 7 * 24 * 3600 * 1000 // 7 days
  })

  ctx.body = {
    id: user?.id,
    username:user?.username,
    email: user?.email,
    accessToken,
    message: "登录成功"
  }

})

// 刷新token
useRouter.post("/refresh",async(ctx) =>{
  const refreshToken = ctx.cookies.get("refreshToken");
  if(!refreshToken) {
    ctx.throw(401,'没有找到 refresh token')
    return
  }

  try {
    // 校验refreshToken
    const payload = verifyRefreshToken(refreshToken)
    if(typeof payload === 'object'){
      const newAccessToken = generateAccessToken({id:payload.id,email:payload.email})
      ctx.body = {accessToken:newAccessToken}
    } 
  } catch (err ) {
    ctx.status = 401;
    ctx.body = {message: "无效的 refresh token"}
  }
})

// 获取个人资料
useRouter.get('/profile',authMiddleware,async(ctx:any) =>{
  if(!ctx.state.user) {
    ctx.throw(401,'Not authenticated')
    return;
  }

  ctx.body = {
    username: 'test',
    icon: '11111',
    email: '11111@11.com'
  }
})


export default useRouter