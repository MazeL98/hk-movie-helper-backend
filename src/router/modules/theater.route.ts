import Router from "@koa/router";
import { getTheaterList } from "../../controller/theater.controller";

const theaterRouter = new Router({
    prefix: "/api/theater",
});

theaterRouter.get("/list", async (ctx: any, next: any) => {
        const result = await getTheaterList();
        ctx.body = result;
});


export default theaterRouter;