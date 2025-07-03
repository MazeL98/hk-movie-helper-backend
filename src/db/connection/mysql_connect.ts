import { Sequelize, Dialect } from "sequelize";
import  DB_CONFIG from '../../config/config.db'

const {mysql } = DB_CONFIG;

const sequelizeOptions = {
  ...mysql.base,
  dialect: (mysql.base.dialect as Dialect ) || 'mysql' // 添加类型断言并提供默认值
};

// 修改方式一：确保 mysql.conf 是一个包含 [database, username, password] 的数组
export const seq = new Sequelize(mysql.conf[0], mysql.conf[1], mysql.conf[2], sequelizeOptions)

