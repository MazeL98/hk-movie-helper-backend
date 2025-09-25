import Router from "@koa/router";
import { getScheduleList,getScheduleDatesForFilm,getScheduleDatesForCinema } from "../../controller/schedule.controller";
import {scheduleListQuerySchema,scheduleValidDatesQuerySchema} from "../../types/schedule"

const scheduleRouter = new Router({
    prefix: "/api/schedule",
});

 

 

scheduleRouter.get("/list", async (ctx: any, next: any) => {
    console.log("收到schedule请求");
    const parsedQuery = scheduleListQuerySchema.safeParse(ctx.query);
    if(!parsedQuery.success) {
      ctx.status = 400
      ctx.message = {error: parsedQuery.error.errors}
      ctx.body= null
      return;
    }
    console.log("解析query",parsedQuery.data)
    const result = await getScheduleList(parsedQuery.data);
    ctx.body = result;
});

scheduleRouter.get("/valid_dates", async (ctx: any, next: any) => {
    console.log("收到valid_dates请求");
    const parsedQuery = scheduleValidDatesQuerySchema.safeParse(ctx.query);
    if(!parsedQuery.success) {
      ctx.status = 400
      ctx.message = {error: parsedQuery.error.errors}
      ctx.body= null
      return;
    }
    if(parsedQuery.data.filmID){
       ctx.body = await getScheduleDatesForFilm(parsedQuery.data)
    } else if (parsedQuery.data.cinemaID) {
      ctx.body = await getScheduleDatesForCinema(parsedQuery.data.cinemaID)
    } else {
      ctx.body = null
      ctx.message = {error: "查询条件缺失"}
    }

});

export default scheduleRouter;
