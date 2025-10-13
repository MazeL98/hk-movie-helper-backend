
import  Koa from 'koa';
import  router from './router/index'
import bodyParser from 'koa-bodyparser';
import responseFormatter from './middlewares/responseFormatter'
import cors from "@koa/cors";
// 获取环境变量
import  {ENV_CONFIG} from './config/config.default';
import fs from "fs"
import util from "util"


const logFile = fs.createWriteStream('./app.log', { flags: 'a' });
const logStdout = process.stdout;

console.log = function (...args: Parameters<typeof console.log>):void {
  const message = util.format(...args) + '\n';
  logFile.write(message);   // 写入文件
  logStdout.write(message); // 保持输出到终端
};

console.error = console.log; // 也可以单独重写

const app = new Koa();
// 让koa信任nginx反向代理的请求，默认其是https的
app.proxy = true;

app.use(bodyParser());

app.use(responseFormatter);
app.use(cors({
    origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}))

app.use(async (ctx, next) => {
  console.log('Request protocol:', ctx.protocol); // 'http' or 'https'
  console.log('X-Forwarded-Proto:', ctx.headers['x-forwarded-proto']);
  await next();
});
// 注册路由
app.use(router.routes());




app.listen(ENV_CONFIG.APP_PORT, () => {;
  console.log(`Server is running at http://localhost:${ENV_CONFIG.APP_PORT}`);
});