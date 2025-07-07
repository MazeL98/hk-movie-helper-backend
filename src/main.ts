
import  Koa from 'koa';
import  router from './router/index'
import bodyParser from 'koa-bodyparser';
import responseFormatter from './middlewares/responseFormatter'
import cors from "@koa/cors";
// 获取环境变量
import  {ENV_CONFIG} from './config/config.default';


const app = new Koa();
app.use(bodyParser());
app.use(responseFormatter);
app.use(cors({
    origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}))
// 注册路由
app.use(router.routes());



app.listen(ENV_CONFIG.APP_PORT, () => {;
  console.log(`Server is running at http://localhost:${ENV_CONFIG.APP_PORT}`);
});