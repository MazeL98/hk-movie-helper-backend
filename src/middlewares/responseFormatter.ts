import { Context, Next } from 'koa';
export default async function(ctx:Context,next:Next)  {
  try {
    await next();
    // console.log("在处理前打印ctx.body",ctx.body)
    // If the response has already been handled (e.g., by ctx.body), wrap it
    ctx.body = {
      data: ctx.body || null,
      status: 'success',
      message: null,
    };
  } catch (err:any) {
    // Handle unexpected errors
    ctx.status = err.status || 500;
    ctx.body = {
      data: null,
      status: 'error',
      message: err.message || 'Internal Server Error',
    };

    // Optional: log stack trace
    ctx.app.emit('error', err, ctx);
  }
};