/**
 * 数据库连接
 */
import mysql from 'mysql';
import  {ENV_CONFIG} from '../config/config.default'


const con = mysql.createConnection({
  host: ENV_CONFIG.DB_HOST,
  user: ENV_CONFIG.DB_USER,
  password: ENV_CONFIG.DB_PASSWORD,
  database: ENV_CONFIG.DB_NAME
})

con.on('error', function (err:any) {
  console.log("数据库连接已断开，请尝试重启",err.code); // 'ER_BAD_DB_ERROR'
})


// 简单封装数据库查询
export const execSql = (sql:string) => { 
  return new Promise((resolve, reject) => {
    con.query(sql, function (err:any, result:any) {
      if (err) {
        reject(err)
      }
      console.log('result',result)
      resolve(result)
    })
  })
}


