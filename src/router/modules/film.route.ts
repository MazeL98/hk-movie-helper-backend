import Router from "@koa/router";
import { getFilmList,getFilmsByScheduleDateRange } from "../../controller/film.controller";

const filmRouter = new Router({
    prefix: "/api/film",
});

filmRouter.get("/", (ctx: any, next: any) => {
    ctx.body = "Some films";
});

filmRouter.get("/list", async (ctx: any, next: any) => {
  console.log("收到list请求")
    const { pageNo = 1, pageSize = 20, searchVal} = ctx.query;
    // Convert query string to number
    const pageNumber = parseInt(pageNo as string, 10);
    const pageSizeNumber = parseInt(pageSize as string, 10);
    const result = await getFilmList(pageNumber, pageSizeNumber,searchVal);
    ctx.body = result;
});


filmRouter.get("/list_by_date_range", async (ctx: any, next: any) => {
  console.log("收到list_by_date_range请求")
    const { startDate,endDate } = ctx.query;
    if(!startDate || !endDate){
      throw new Error('缺少查询参数startDate or endDate')
    }
    const result = await getFilmsByScheduleDateRange(startDate,endDate);
    ctx.body = result;
});



export default filmRouter;
