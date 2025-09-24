import {Model,InferAttributes,InferCreationAttributes,CreationOptional } from "sequelize";
import {seq} from "../connection/mysql_connect"
import DataTypes from "../../config/config.db_type"

const {STRING,BIGINT} = DataTypes

class User extends Model<InferAttributes<User>,InferCreationAttributes<User>> {
  declare id?: bigint
  declare username: string
  declare email: string
  declare password_hash:string
}


User.init({
  id: {
    comment: 'userId',
    type: BIGINT,
    unique: true,
    primaryKey: true,
    autoIncrement:true,
     allowNull:false,
  },
  username:{
    comment: '用户昵称',
    type: STRING,
    unique: true,
    allowNull: false,
  },

   email:{
    comment: '邮箱',
    type: STRING,
    unique: true,
    allowNull: false,
  },
  password_hash:{
    comment: '密码',
    type:STRING,
    allowNull:false
  }

},{
  sequelize:seq,
  tableName: "user",
          defaultScope: {
            attributes: {
                exclude: ["createdAt", "updatedAt", "status"],
            },
        },
})


export default User


