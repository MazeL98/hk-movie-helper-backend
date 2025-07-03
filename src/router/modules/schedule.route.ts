import Router from "@koa/router";
import { getScheduleList,getScheduleDatesForFilm,getScheduleDatesForCinema } from "../../controller/schedule.controller";
import z from 'zod';

const scheduleRouter = new Router({
    prefix: "/api/schedule",
});

const listQuerySchema = z.object({
  cinemaId: z.string().optional(),
  filmId:z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const validDatesQuerySchema = z.object({
  cinemaId: z.string().optional(),
  filmId:z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

scheduleRouter.get("/list", async (ctx: any, next: any) => {
    console.log("收到schedule请求");
    const parsedQuery = listQuerySchema.safeParse(ctx.query);
    if(!parsedQuery.success) {
      ctx.status = 400
      ctx.message = {error: parsedQuery.error.errors}
      ctx.body= null
      return;
    }
    console.log("解析query",JSON.stringify(parsedQuery.data))
    const result = await getScheduleList(parsedQuery.data);
    ctx.body = result;
});

scheduleRouter.get("/valid_dates", async (ctx: any, next: any) => {
    console.log("收到valid_dates请求");
    const parsedQuery = validDatesQuerySchema.safeParse(ctx.query);
    if(!parsedQuery.success) {
      ctx.status = 400
      ctx.message = {error: parsedQuery.error.errors}
      ctx.body= null
      return;
    }
    if(parsedQuery.data.filmId){
      const queries = {...parsedQuery.data,filmId:Number(parsedQuery.data.filmId)}
      ctx.body = await getScheduleDatesForFilm(queries)
    } else if (parsedQuery.data.cinemaId) {
      ctx.body = await getScheduleDatesForCinema(Number(parsedQuery.data.cinemaId))
    } else {
      ctx.body = null
      ctx.message = {error: "查询条件缺失"}
    }

});

export default scheduleRouter;
