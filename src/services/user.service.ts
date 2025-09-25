import { InferAttributes, Op } from "sequelize";
import UserModel from "../db/models/user";
type User = InferAttributes<UserModel>;

export interface NewUserItem {
  id?:bigint;
  username:string;
  email:string;
  passwordHash:string;
}


class UserService {
    async getUser(options?: any) {
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: { ...options },
                };
            }
            const res = await UserModel.findOne(filterOptions);

            return res ? res.toJSON() : null;
        } catch (error) {
            console.error(
                "从数据库获取用户数据时发生错误",
                error
            );
            return null;
        }
    }

    async createUser(data: NewUserItem) {
        const existed = await this.getUser({ email: data.email });
        if (existed) {
            throw new Error("用户已存在");
        }
        try {
            const res = await UserModel.create(data);
            if(res.id){
              console.log(`添加用户${res.id}成功`);
              const {id,username,email} = res
              return {id,username,email};
            }

            
        } catch (err) {
            console.log("添加用户失败", err);
            return null
        }
    }
}

export default new UserService();
