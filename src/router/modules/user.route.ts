import  Router from '@koa/router'
const useRouter = new Router({
  prefix: '/api/user'
})

useRouter.get('/', (ctx :any,next:any)  => {
  ctx.body = 'Hello User';
})

export default useRouter