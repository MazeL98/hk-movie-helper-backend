import Router from "@koa/router";
import crawlerController from "../../controller/Crawler";
const crawlerRouter = new Router({
    prefix: "/api/crawler",
});
import { ENV_CONFIG } from "../../config/config.default";



crawlerRouter.get("/crawl_film_data", async (ctx: any) => {
    ctx.body = "爬取数据ing";
    // step1 爬取影院网站上的电影数据
    const filmCrawlerRes = await crawlerController.crawlAllFilmsFromCinema();
    ctx.body = JSON.stringify(filmCrawlerRes);
    // // step2 查询豆瓣信息
    // const doubanRes = await crawlerController.crawlFilmFromDouban()
    // ctx.body = JSON.stringify(doubanRes)
});

crawlerRouter.get("/crawl_douban_data", async (ctx: any) => {
    ctx.body = "爬取豆瓣数据ing";

    const doubanCrawlerRes = await crawlerController.crawlFilmFromDouban();
    ctx.body = JSON.stringify(doubanCrawlerRes);
});

crawlerRouter.get('/crawl_imdb_data',async(ctx:any) => {
    ctx.body = "爬取IMDB数据ing";
    const imdbCrawlerRes = await crawlerController.crawlFilmFromImdb()
    ctx.body = JSON.stringify(imdbCrawlerRes)
})

export default crawlerRouter;
