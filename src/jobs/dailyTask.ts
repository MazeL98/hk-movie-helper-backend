import { seq } from "../db/connection/mysql_connect";
import crawlerController from "../controller/Crawler";

// 清空电影列表和排片表数据
const resetFilmAndScheduleTable = async () => {
    try {
        await seq.query("DELETE FROM film WHERE id > 0;");
        await seq.query("ALTER TABLE film AUTO_INCREMENT = 1;");
        await seq.query("DELETE FROM schedule WHERE id > 0;");
        await seq.query("ALTER TABLE schedule AUTO_INCREMENT = 1;");
        console.log("[Task] Tables cleared and reset.");
    } catch (err) {
        console.error("[Task] Failed to reset tables:", err);
    }
};

// 运行爬虫
const crawlFilm = async () => {
    return await crawlerController.crawlAllFilmsFromCinema();
};

const crawlIMDb = async () => {
    return await crawlerController.crawlFilmFromImdb();
};

const crawlDouban = async () => {
    const originalHttpProxy = process.env.HTTP_PROXY;
    const originalHttpsProxy = process.env.HTTPS_PROXY;
    const originalNodeTlsRejectUnauthorized =
        process.env.NODE_TLS_REJECT_UNAUTHORIZED;

    // 清除代理设置
    process.env.HTTP_PROXY = "";
    process.env.HTTPS_PROXY = "";
    process.env.http_proxy = "";
    process.env.https_proxy = "";
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1"; // 恢复正常的TLS验证

   const res = await crawlerController.crawlFilmFromDouban();
    // 恢复代理设置
    process.env.HTTP_PROXY = originalHttpProxy;
    process.env.HTTPS_PROXY = originalHttpsProxy;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED =
        originalNodeTlsRejectUnauthorized;
    return res;
};

const runCrawlerTasks = async () => {
    try {
        // const filmRes = await crawlFilm();
        // console.log(
        //     "[Task] Film data crawled. Result:",
        //     JSON.stringify(filmRes)
        // );
        // const succeeded = filmRes.filter(
        //     (r) => r.status === "fulfilled"
        // ).length;
        // if(succeeded < 1){
        //   throw  new Error('[Task] crawl film data failed.Stop the whole task.');
        // }
        // const IMDbRes = await crawlIMDb();
        // console.log(
        //     "[Task] IMDB data crawled. Result:",
        //     JSON.stringify(IMDbRes)
        // );

        const DoubanRes = await crawlDouban();
        console.log(
            "[Task] Douban data crawled. Result:",
            JSON.stringify(DoubanRes)
        );
    } catch (err) {
        console.error("[Task] Crawling task failed:", err);
    }
};

(async () => {
  // await resetFilmAndScheduleTable();
  await runCrawlerTasks();
})();
