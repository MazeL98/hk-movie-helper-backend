import { chromium, Page } from "playwright";

// 定义等待类型
type WaitUntilState = "load" | "domcontentloaded" | "networkidle" | "commit";

// 定义选项接口
interface CrawlerOptions {
    headless?: boolean;
    timeout?: number;
    userAgent?: string;
    waitUntil?: WaitUntilState;
    [key: string]: any;
}

// 简单处理器 - 处理单个页面
type SimpleHandlerFunction = (page: Page) => Promise<any>;

// 复杂处理器 - 可以控制爬虫流程，返回下一个URL或结束爬取
interface AdvancedHandler {
    // 处理当前页面，返回下一个要访问的URL或null表示结束
    handle: (page: Page, context: any) => Promise<string | null>;
    // 处理最终结果
    getResult?: (context: any) => any;
      [key: string]: any;

} 

export default async function ({
    urls,
    handlers,
    options
}: {
    urls: string | (string | null)[];
    handlers: SimpleHandlerFunction | SimpleHandlerFunction[] | AdvancedHandler;
    options?: CrawlerOptions;
}) {
    const defaultOptions: CrawlerOptions = {
        headless: true,
        timeout: 60000,
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        waitUntil: "networkidle",
    };

    const mergedOptions = Object.assign({}, defaultOptions, options);

    const browser = await chromium.launch({ headless: mergedOptions.headless });
    try {
        const context = await browser.newContext({
            userAgent: mergedOptions.userAgent,
            viewport: { width: 1280, height: 800 },
        });

        const page = await context.newPage();

        let result: any;
        // 多个URL对应一个处理函数
        if ("handle" in handlers) {
            const advancedHandler = handlers as AdvancedHandler;
            let nextUrl: string | null = Array.isArray(urls)
                ? urls[0]
                : (urls as string);
            console.log("下一个搜索地址是", nextUrl);

            while (nextUrl) {
                page.on("pageerror", (error) => {
                    console.error("❌ Page error:", error.message);
                });
                await page.goto(nextUrl, {
                    timeout: mergedOptions.timeout,
                    waitUntil: 'domcontentloaded',
                });
              
                // 处理当前页面并获取下一个URL
                nextUrl = await advancedHandler.handle(page, context);
                await page.waitForTimeout(Math.random() * 10000)
            }

            result = advancedHandler.getResult
                ? advancedHandler.getResult(context)
                : null;
        } else if (Array.isArray(urls) && Array.isArray(handlers)) {
            // 多个URL对应多个处理函数
            result = [];
            for (let i = 0; i < urls.length; i++) {
                const path = urls[i];
                if (!path) continue;
                await page.goto(path, {
                    timeout: mergedOptions.timeout,
                    waitUntil: mergedOptions.waitUntil as WaitUntilState,
                });

                // Call the handler with the page object
                const itemRes = (await handlers[i](page)) || null;
                if (Array.isArray(itemRes)) {
                    result = result.concat(itemRes);
                }
            }
        } else {
            await page.goto(urls as string, {
                timeout: mergedOptions.timeout,
                waitUntil: mergedOptions.waitUntil as WaitUntilState,
            });

            // Call the handler with the page object
            result = (await (handlers as SimpleHandlerFunction)(page)) || null;
        }
        if (process.send && result) {
            process.send(result);
        }
    } catch (error: any) {
        console.log("An error occurred", error);
        process.send && process.send({ error: error.message });
    } finally {
        await browser.close();
        // Exit the child process after completion
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }
}
