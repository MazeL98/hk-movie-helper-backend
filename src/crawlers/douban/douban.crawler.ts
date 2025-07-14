
import {
    chromium,
    type Page,
    type Browser,
    type BrowserContext,
} from "playwright";
import filmService from "../../services/film.service";
import { FilmItem } from "../../types/film";
import ping from "ping";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { launchChromeOnce } from "../../libs/utils";
import { formatNameForDoubanQuery } from "../../libs/format";

interface DoubanCrawlerOptions {
    maxRetries: number;
    concurrency: number;
    delayBetweenRequests: { min: number; max: number };
    [key: string]: any;
}

class DoubanCrawler {
    private options: DoubanCrawlerOptions;
    private userAgents: string[];
    // private proxies: string[];
    private originData: FilmItem[];
    private data: FilmItem[];
    private errorCount: number;

    constructor(options: any) {
        this.options = {
            maxRetries: options.maxRetries || 2,
            concurrency: options.concurrency || 2, // 同时运行的浏览器数量
            delayBetweenRequests: options.delayBetweenRequests || {
                min: 2000,
                max: 5000,
            },
            ...options,
        };

        this.userAgents = [
            "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.2; Trident/3.0)",
            "Mozilla/5.0 (Windows; U; Windows NT 5.0) AppleWebKit/533.50.5 (KHTML, like Gecko) Version/4.0.3 Safari/533.50.5",
            "Opera/8.76.(Windows NT 5.1; iu-CA) Presto/2.9.189 Version/10.00",
            "Mozilla/5.0 (compatible; MSIE 5.0; Windows 95; Trident/5.0)",
            "Mozilla/5.0 (Windows NT 5.2; niu-NZ; rv:1.9.0.20) Gecko/2013-03-18 09:06:21 Firefox/3.6.4",
            "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/3.0)",
            "Mozilla/5.0 (Windows 98) AppleWebKit/534.2 (KHTML, like Gecko) Chrome/20.0.839.0 Safari/534.2",
            "Mozilla/5.0 (Windows; U; Windows NT 5.0) AppleWebKit/532.18.7 (KHTML, like Gecko) Version/5.1 Safari/532.18.7",
            "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/4.0)",
            "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 5.2; Trident/3.1)",
            "Mozilla/5.0 (compatible; MSIE 6.0; Windows 95; Trident/3.1)",
            "Opera/8.20.(Windows NT 6.0; yue-HK) Presto/2.9.161 Version/11.00",
            "Mozilla/5.0 (Windows; U; Windows NT 10.0) AppleWebKit/534.33.5 (KHTML, like Gecko) Version/5.1 Safari/534.33.5",
            "Mozilla/5.0 (Windows NT 10.0; az-AZ; rv:1.9.0.20) Gecko/2019-08-14 21:23:47 Firefox/12.0",
            "Opera/8.72.(Windows 98; Win 9x 4.90; bg-BG) Presto/2.9.185 Version/11.00    ",
        ];

        this.originData = [];
        this.data = [];
        this.errorCount = 0;
    }

    async getOriginData() {
        return await filmService.getFilmData({}, [
            "name_hk",
            "source",
            "imdb_id",
        ]);
    }

    getSearchUrl(currentOriginData: FilmItem) {
        let searchUrl = "";
        if (currentOriginData.imdb_id) {
            searchUrl = `https://search.douban.com/movie/subject_search?search_text=${currentOriginData.imdb_id}&cat=1002`;
        } else if (currentOriginData.name_hk) {
          const query = formatNameForDoubanQuery(currentOriginData.name_hk)
            searchUrl = `https://search.douban.com/movie/subject_search?search_text=${query}&cat=1002`;
        }
        return searchUrl;
    }

    async checkIPReachable(ip: string) {
        const res = await ping.promise.probe(ip, { timeout: 3 });
        return res.alive;
    }

    // 获取随机UserAgent
    getRandomUserAgent() {
        return this.userAgents[
            Math.floor(Math.random() * this.userAgents.length)
        ];
    }

    // 随机延迟
    async randomDelay() {
        const { min, max } = this.options.delayBetweenRequests;
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        console.log(`等待 ${delay}ms...`);
        return new Promise((resolve) => setTimeout(resolve, delay));
    }
    // 保存爬取的数据
    getResultData() {
        return this.data;
    }

    async saveCookies(contextId: number, context: BrowserContext) {
        console.log("开始执行saveCookies...");
        try {
            // 先取出cookieMap再更新
            const filePath = path.join(__dirname, "../../data/cookies.json");
            const cookies = await context.cookies();
            const jsonData = await readFile(filePath, "utf-8");
            const cookieMap = new Map(jsonData ? JSON.parse(jsonData) : []);
            cookieMap.set(contextId, cookies);
            const serialized = JSON.stringify(
                Array.from(cookieMap.entries()),
                null,
                2
            );
            await writeFile(filePath, serialized);
            console.log(`context-${contextId}保存cookie到文件中,${cookies}`);
        } catch (error) {
            console.error("保存cookie失败", error);
        }
    }

    async renewCookies(contextId: number, context: BrowserContext, page: Page) {
        console.log("执行Renewing cookies...");
        await context.clearCookies();
        const current = await context.cookies();
        console.log("当前cookie", current);
        await this.randomDelay();
        try {
            // 先访问首页，然后才访问API，模拟真实用户行为
            await page.goto("https://movie.douban.com/", {
                waitUntil: "domcontentloaded",
            });
            await this.saveCookies(contextId, context);
        } catch (error) {
            console.error("renew cookie 失败", error);
            throw error;
        }
        await this.randomDelay();
    }

    // 创建浏览器上
    async createBrowserContext() {
        // 使用本地浏览器
        await launchChromeOnce();
        //  console.log("浏览器调用结果",res)
        const browser = await chromium.connectOverCDP("http://127.0.0.1:9999");
        const context = browser.contexts()[0] || (await browser.newContext());

        return { browser, context };
    }

    // 初始化浏览器实例池与工作队列
    async scrape() {
        const { browser, context } = await this.createBrowserContext();

        try {
            // 获取原始数据
            this.originData = await this.getOriginData();
            const targetCount =
                Array.isArray(this.originData) && this.originData.length
                    ? this.originData.length
                    : 0;
            if (!targetCount) {
                console.log("目标爬取数量为0", this.originData);
                return;
            }

            for (const data of this.originData) {
                // 处理任务
                try {
                    await this.scrapeWithContext(context, data);
                } catch (err) {
                    console.error("执行scrapeWithContext出错:", err);
                    this.errorCount++;
                }

                await this.randomDelay();
            }

            // 等待所有浏览器上下文完成工作
            console.log(`爬取完成! 获取了 ${this.data.length} 部电影`);
        } catch (error) {
            console.error("主爬虫运行出错:", error);
        } finally {
            // 关闭所有浏览器
            await browser.close();

            setTimeout(() => {
                process.exit(0);
            }, 1000);
        }
    }

    // 任务调度
    async scrapeWithContext(context: BrowserContext, currentData: FilmItem) {
        console.log("开始执行scrapeWithContext");
        try {
            const { success, filmData } = await this.scrapeByPage(
                context,
                currentData
            );
            if (success && filmData) {
                this.data.push({
                    ...currentData,
                    ...filmData,
                });
            } else {
                console.log(`爬取任务${currentData.name_hk}失败`);
                this.errorCount++;
            }
        } catch (error) {}
    }

    // 具体的任务执行
    async scrapeByPage(context: BrowserContext, currentData: FilmItem) {
        let filmData: any = {};
        let success = false;
        let retries = 0;
        let page: Page | null = null;
        try {
            page = await context.newPage();
            while (retries < this.options.maxRetries && !success) {
                try {
                    // 先访问首页，然后才访问API，模拟真实用户行为
                    await page.goto("https://movie.douban.com/", {
                        waitUntil: "domcontentloaded",
                    });
                    await this.randomDelay();
                    const searchUrl = this.getSearchUrl(currentData);
                    await page.goto(searchUrl, {
                        timeout: 10000,
                        waitUntil: "domcontentloaded",
                    });

                    // 检查是否有按钮验证
                    const isButtonVisible = await page
                        .getByRole("button", { name: "点我继续浏览" })
                        .isVisible();
                    if (isButtonVisible) {
                        console.log("看到了阻碍的按钮");
                        await page
                            .locator("#sub")
                            .evaluate((ele: HTMLButtonElement) => {
                                if (ele) {
                                    ele.click();
                                }
                            });
                    }

                    
                    const hasContent =
                        (await page.locator(".item-root").count()) > 0;
                    if (!hasContent) {
                        const detailText = await page
                            .locator(
                                "#root > div > div:nth-child(2) div div:nth-child(2) div"
                            )
                            .textContent();
                            // 没有搜索结果
                        if (detailText && detailText.includes("没有找到")) {
                            success = false;
                            return {
                                success,
                                filmData: {},
                            };
                        } else {
                          // 触发访问频繁
                            console.log(
                                `第${retries + 1}/${
                                    this.options.maxRetries
                                }失败，原因是搜索页内容异常`
                            );
                            retries++;
                            continue;
                        }
                    }
                    const detailUrl = await page.evaluate(() => {
                        return document
                            .querySelector(".item-root > a")
                            ?.getAttribute("href");
                    });
                    console.log("搜索结果url", detailUrl);
                    if (!detailUrl) {
                        return {
                            success: false,
                            filmData: {},
                            msg: "没有接收到详情页地址",
                        };
                    }
                    // 进入第一个结果的详情页
                    await page.goto(detailUrl, {
                        waitUntil: "domcontentloaded",
                        timeout: 10000,
                    });
                    const waitDetailResult = await page.waitForSelector(
                        "#wrapper #content",
                        { timeout: 20000 }
                    );
                    if (!waitDetailResult) {
                        retries++;
                        continue;
                    }
                    filmData.rating_douban = await page
                        .locator(".rating_num")
                        .evaluate((ele) => {
                            if (ele) {
                                return Number(ele.textContent);
                            } else {
                                return 0;
                            }
                        })
                        .catch((error) => {
                            console.log("找不到评分元素", error);
                        });

                    filmData.name_simplified = await page
                        .locator("#wrapper #content h1 span:first-child")
                        .evaluate((ele) => {
                            if (ele) {
                                return ele.textContent;
                            } else {
                                return "";
                            }
                        })
                        .catch((error) => {
                            console.log("找不到名称元素", error);
                        });

                    const { director_simplified, cast_simplified } = await page
                        .locator("#info > span")
                        .evaluateAll((eles) => {
                            let director_simplified = "",
                                cast_simplified = "";
                            for (const ele of Array.from(eles)) {
                                const labelEle = ele.querySelector(".pl");
                                if (
                                    labelEle &&
                                    labelEle.textContent === "导演"
                                ) {
                                    director_simplified =
                                        ele.querySelector(".attrs a")
                                            ?.textContent || "";
                                } else if (
                                    labelEle &&
                                    labelEle.textContent === "主演"
                                ) {
                                    const castEles =
                                        ele.querySelectorAll(".attrs span a");
                                    Array.from(castEles).forEach((item) => {
                                        cast_simplified +=
                                            item.textContent + "/";
                                    });
                                    cast_simplified = cast_simplified.slice(
                                        0,
                                        -1
                                    );
                                }
                            }
                            return {
                                director_simplified,
                                cast_simplified,
                            };
                        });
                    filmData.douban_id = page.url()?.split("/")?.at(-2);
                    success = true;
                    return {
                        success,
                        filmData: {
                            ...filmData,
                            director_simplified,
                            cast_simplified,
                        },
                    };
                } catch (error) {
                    console.log(
                        `第${retries + 1}/${
                            this.options.maxRetries
                        }失败，原因是${error}`
                    );
                    retries++;
                    if (retries < this.options.maxRetries) {
                        await this.randomDelay();
                    }
                }
            }
            return {
                success: false,
                filmData: {},
            };
        } finally {
            if (page) {
                await page.close();
            }
        }
    }
}

async function main() {
    const scraper = new DoubanCrawler({
        concurrency: 1,
        delayBetweenRequests: { min: 5000, max: 10000 },
    });

    await scraper.scrape();
    const result = scraper.getResultData();
    if (process.send && result) {
        process.send(result);
    }
}

main().catch((error) => {
    console.error("程序执行出错:", error);
    process.exit(1);
});
