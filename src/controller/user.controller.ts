import userService,{NewUserItem} from "../services/user.service";
import bcrypt from "bcrypt";

interface UserQuery{
  email?:string;
  id?:bigint;
  username?:string;
}

interface User {
  email:string;
  id?:bigint;
  username:string;
  password:string;
}

export const getUser = async (query:UserQuery) => {

    const result = await  userService.getUser(query)

    return result;
};


export const createUser = async(data:User)=>{
     const saltRounds = 10;
      const {username,email,password} = data
  const password_hash = await bcrypt.hash(password, saltRounds);
 
  const res =  await userService.createUser({
    username,email,password_hash
  })

  return res;
}
