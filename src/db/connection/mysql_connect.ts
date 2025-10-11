import { Sequelize, Dialect,Model } from "sequelize";
import  DB_CONFIG from '../../config/config.db'

const {mysql } = DB_CONFIG;

// 覆盖toJSON()，当字段属性为bigInt时绕过getter，转换为字符串，供前端使用。其余时间保持bigInt
(Model as any).prototype.toJSON = function () {
  const attributes = { ...this.get() };
  for (const key of Object.keys(attributes)) {
    const value = attributes[key];
    if (typeof attributes[key] === "bigint") {
      attributes[key] = attributes[key].toString();
    }
     // 2. 处理嵌套的 Model 实例（include 回来的）
    else if (value instanceof Model) {
      attributes[key] = value.toJSON(); // 递归调用
    }
    // 3. 处理数组（hasMany 等关联返回的数组）
    else if (Array.isArray(value)) {
      attributes[key] = value.map(item =>
        item instanceof Model ? item.toJSON() : item
      );
    }
  }
  return attributes;
};

const sequelizeOptions = {
  ...mysql.base,
  dialect: (mysql.base.dialect as Dialect ) || 'mysql', // 添加类型断言并提供默认值
  dialectOptions: {
    supportBigNumbers: true,
    bigNumberStrings: true, // 强制 BIGINT 用字符串返回
  },
  logging:false
};

// 修改方式一：确保 mysql.conf 是一个包含 [database, username, password] 的数组
export const seq = new Sequelize(mysql.conf[0], mysql.conf[1], mysql.conf[2], sequelizeOptions)


