import Router from "@koa/router";
import { getCinemaList } from "../../controller/cinema.controller";

const cinemaRouter = new Router({
    prefix: "/api/cinema",
});

cinemaRouter.get("/list", async (ctx: any, next: any) => {
  console.log("收到list请求")
    const { pageNo = 1, pageSize = 20, districtId,theaterId } = ctx.query;
    // Convert query string to number
    const pageNumber = parseInt(pageNo as string, 10);
    const pageSizeNumber = parseInt(pageSize as string, 10);
    let districtIdNumber;
    let theaterIdNumber;
    if(districtId){
      districtIdNumber = parseInt(districtId as string, 10);
    }
    if(theaterId) {
      theaterIdNumber = parseInt(theaterId as string, 10);
    }
        const result = await getCinemaList(pageNumber,pageSizeNumber,districtIdNumber,theaterIdNumber);
        ctx.body = result;
});

export default cinemaRouter;
