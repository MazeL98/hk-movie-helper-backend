import Router from "@koa/router";
import { getEventByUser, addEvent } from "../../controller/event.controller";
 import {eventListQuerySchema} from "../../types/event"

const eventRouter = new Router({
    prefix: "/api/event",
});
 

eventRouter.get("/list", async (ctx: any, next: any) => {
    const parsedQuery = eventListQuerySchema.safeParse(ctx.query);
    if (!parsedQuery.success) {
      ctx.status = 400
      ctx.message = {error: parsedQuery.error.errors}
      ctx.body= null
      return;
    }

    const result = await getEventByUser(parsedQuery.data);
        ctx.body = result;
});

eventRouter.post("/add", async (ctx: any, next: any) => {
    const parsedQuery = eventListQuerySchema.safeParse(ctx.query);
    if (!parsedQuery.success) {
      ctx.status = 400
      ctx.message = {error: parsedQuery.error.errors}
      ctx.body= null
      return;
    }

    const result = await getEventByUser(parsedQuery.data);
        ctx.body = result;
});

export default eventRouter;
