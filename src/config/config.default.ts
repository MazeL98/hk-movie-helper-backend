import dotenv from 'dotenv';
import path from 'path';


// 获取当前环境
const env = process.env.NODE_ENV || 'development';

// 根据环境加载不同的环境变量文件
const envPath = path.resolve(process.cwd(),env === 'production' ? '.env.production' : '.env.development');
// 首先尝试加载环境特定的文件
dotenv.config({path: envPath});
// 然后加载默认的 .env 文件（如果存在的话，会覆盖已有的同名变量）
dotenv.config();

console.log(`Environment: ${env}`);
console.log(`APP_PORT: ${process.env.APP_PORT}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD}`);

export const ENV_CONFIG =  process.env;