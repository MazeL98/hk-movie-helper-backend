import Router from "@koa/router";
import {
    addUserEvent,
    getUserEvents,
    deleteUserEvent,
} from "../../controller/event.controller";
import { eventListQuerySchema, eventAddSchema } from "../../types/event";
import { logTitle } from "../../libs/log";
const eventRouter = new Router({
    prefix: "/api/event",
});

eventRouter.get("/list", async (ctx: any, next: any) => {
    logTitle("event list 请求");
    ctx.query.userID = BigInt(ctx.query.userID);
    const parsedQuery = eventListQuerySchema.safeParse(ctx.query);
    console.log("路由参数校验结果", parsedQuery.success, parsedQuery.error);
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
    const { userID, scheduleID } = ctx.request.body;
    const parsedQuery = eventAddSchema.safeParse({
        userID: BigInt(userID),
        scheduleID: BigInt(scheduleID),
    });

    if (!parsedQuery.success) {
        ctx.status = 400;
        ctx.message = { error: parsedQuery.error.errors };
        ctx.body = null;
        return;
    }

    const result = await addUserEvent(parsedQuery.data);
    ctx.body = result;
});

eventRouter.delete("/delete/:id", async (ctx: any, next: any) => {
    logTitle("收到event delete 请求");
    const { id } = ctx.params;

    if (!id) {
        ctx.status = 400;
        ctx.message = { error: "缺少event id" };
        ctx.body = null;
        return;
    }
    try {
        const result = await deleteUserEvent(BigInt(id));

        if (typeof result === "number") {
            ctx.body = "删除成功";
        } else {
            ctx.status = 204;
            ctx.message = "No Content";
            ctx.body = "删除失败，没有找到指定内容";
        }
    } catch (error) {
        ctx.status = 204;
        ctx.message = "No Content";
        ctx.body = "删除失败，没有找到指定内容";
    }
});

export default eventRouter;
