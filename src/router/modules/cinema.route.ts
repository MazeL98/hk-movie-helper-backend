import Router from "@koa/router";
import { getCinemaList } from "../../controller/cinema.controller";

const cinemaRouter = new Router({
    prefix: "/api/cinema",
});

cinemaRouter.get("/list", async (ctx: any, next: any) => {
  console.log("收到list请求",ctx.path)
    const { pageNo = 1, pageSize = 20, districtID,theaterID } = ctx.query;
    // Convert query string to number
    const pageNumber = parseInt(pageNo as string, 10);
    const pageSizeNumber = parseInt(pageSize as string, 10);
    let districtIDNumber;
    let theaterIDNumber;
    if(districtID){
      districtIDNumber = parseInt(districtID as string, 10);
    }
    if(theaterID) {
      theaterIDNumber = parseInt(theaterID as string, 10);
    }
        const result = await getCinemaList(pageNumber,pageSizeNumber,districtIDNumber,theaterIDNumber);
        ctx.body = result;
});

export default cinemaRouter;
