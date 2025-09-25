import Router from "@koa/router";
import { addUserEvent, getUserEvents,deleteUserEvent } from "../../controller/event.controller";
import { eventListQuerySchema, eventAddSchema } from "../../types/event";

const eventRouter = new Router({
    prefix: "/api/event",
});

eventRouter.get("/list", async (ctx: any, next: any) => {
    const parsedQuery = eventListQuerySchema.safeParse(ctx.query);
    if (!parsedQuery.success) {
        ctx.status = 400;
        ctx.message = { error: parsedQuery.error.errors };
        ctx.body = null;
        return;
    }

    const result = await getUserEvents(parsedQuery.data);
    ctx.body = result;
});

eventRouter.post("/add", async (ctx: any, next: any) => {

  const {userID,scheduleID} = ctx.request.body
    const parsedQuery = eventAddSchema.safeParse({userID:BigInt(userID),scheduleID:BigInt(scheduleID)});

    if (!parsedQuery.success) {
        ctx.status = 400;
        ctx.message = { error: parsedQuery.error.errors };
        ctx.body = null;
        return;
    }

    const result = await addUserEvent(parsedQuery.data);
    ctx.body = result;
});

eventRouter.delete("/delete", async (ctx: any, next: any) => {
    const { eventID } = ctx.params;
    if (!eventID) {
        ctx.status = 400;
        ctx.message = { error: "缺少event id" };
        ctx.body = null;
        return;
    }
    try {
        const result = await deleteUserEvent(BigInt(eventID));
    if(typeof result === 'number') {
      ctx.body = "删除成功"
    }
    } catch (error) {
        ctx.status=204
        ctx.message = "No Content"
        ctx.body = null;
    }
      
});

export default eventRouter;
