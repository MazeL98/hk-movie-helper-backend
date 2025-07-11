import {readdirSync} from 'fs'
import path from 'path'
import Router from '@koa/router'

const router = new Router()

const modulesPath = path.join(__dirname, './modules');
const files = readdirSync(modulesPath);

for(const file of files) {
  if (file.endsWith('.ts') || file.endsWith('.js')) {
    const routeModule = require(path.join(modulesPath,file))
    const moduleRouter = routeModule.default || routeModule;

    if(moduleRouter instanceof Router) {
      router.use( moduleRouter.routes(), moduleRouter.allowedMethods());
    }
  }
}


// 导出总路由
export default router;