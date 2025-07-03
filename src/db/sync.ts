import { seq } from "./connection/mysql_connect";
import  "./models"
import { ENV_CONFIG } from "../config/config.default";
import {addStaticTheaters} from "./models/theater"
import { addStaticCinemas } from "./models/cinema";


async function syncDatabase(options: {force?:boolean;alter?:boolean}={}) {
  try{
    await seq.authenticate();
    console.log(`[${ENV_CONFIG.NODE_ENV}] 数据库连接成功`);
    // console.log('定义模型如下:', Object.keys(seq.models));
    const syncOptions = {
      ...options,
      logging:false, // 日志输出
      // logging:console.log
    };

     // 输出警告
     if (syncOptions.force) {
      console.warn('⚠️ 警告: 将删除并重新创建所有表!');
      // 添加确认提示逻辑
    } else if (syncOptions.alter) {
      console.warn('⚠️ 警告: 将修改表结构以匹配模型!');
    }

    await seq.sync(syncOptions);
    console.log(`[${ENV_CONFIG.NODE_ENV}] 表同步成功`);
    await addStaticTheaters()
    await addStaticCinemas()
    console.log("添加静态院线和影院数据")
  } catch(error) {
    console.log('表同步失败:',error)
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// 命令行参数处理
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: {force?: boolean; alter?: boolean} = {};
  
  if (args.includes('--force')) {
    options.force = true;
  } else if (args.includes('--alter')) {
    options.alter = true;
  }
  
  syncDatabase(options)
}

export { syncDatabase };