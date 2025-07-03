import crawler from "../../libs/crawler";
import type { Page } from "playwright";
import { FilmItemWithSchedule } from "../../types/film";
import { FILM_SOURCE, filmSources } from "../../const/film_source";
import { extractUrlFromCss } from "../../libs/format";
const scrapeInfoUrls = async (page: Page) => {
    const urls = await page
        .locator(".movie-list .movie-item")
        .evaluateAll((eles) => {
            const detailUrls = eles.map((ele) => {
                return (
                    ele
                        .querySelector("a.add-location-img")
                        ?.getAttribute("href") || ""
                );
            });
            return detailUrls;
        });
    return urls;
};

const extractDirectorAndCast = async (page: Page, lang = "hk") => {
    const data = await page.evaluate((lang) => {
        let director = "",
            cast = "";
        const containersNodes = document.querySelectorAll(
            ".movie-intro-list > div"
        );
        for (const container of Array.from(containersNodes)) {
            const label =
                container.querySelector(".movie-intro-title")?.textContent ||
                "";
            const value =
                container.querySelector(".movie-intro-name")?.textContent || "";
            if (label?.includes("Director") || label?.includes("導演")) {
                director = value;
            } else if (label?.includes("Cast") || label?.includes("演員")) {
                cast = value;
            }
        }
        return {
            ["director_" + lang]: director,
            ["cast_" + lang]: cast,
        };
    }, lang);
    return data;
};

const processInfo = async (browserContext: any, url: string) => {
    if (!url) return null;
    const detailPage = await browserContext.newPage();
    try {
        await detailPage.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });
        await detailPage
            .waitForSelector(".movie-name", { timeout: 60000 })
            .catch(() => {
                console.log(`source eeg 无法找到电影详情元素: ${url}`);
            });

        // 获取电影名称，时长，语言
        const baseInfo = await detailPage.evaluate(() => {
            const poster_url_external = (
                document.querySelector(".movie-bg") as HTMLElement
            )?.style?.backgroundImage;
            const name_hk = document
                .querySelector(".movie-name")
                ?.textContent?.trim();
            let duration = "",
                on_screen_date = "",
                language = "";

            const nodeList = document.querySelectorAll(
                ".movie-info .movie-info-item"
            );
            for (const ele of Array.from(nodeList)) {
                const label = ele.querySelector("span")?.textContent?.trim();
                const content =
                    ele
                        .querySelector(".movie-info-item-content")
                        ?.textContent?.trim() || "";
                if (label?.includes("片長")) {
                    duration = content;
                } else if (label?.includes("上映日期")) {
                    on_screen_date = content;
                } else if (label?.includes("語言")) {
                    language = content;
                } else if (label?.includes("字幕")) {
                    language += "(" + content + label + ")";
                }
            }

            return {
                name_hk,
                on_screen_date,
                duration,
                poster_url_external,
                language,
                source: 0,
            };
        });
        // 获取导演和卡司
        const { director_hk, cast_hk } = await extractDirectorAndCast(
            detailPage,
            "hk"
        );
        // 获取排片数据
        const scheduleByCinemaArr = await detailPage.evaluate(() => {
            // 获取排片
            const cinemaNodes = document.querySelectorAll(".show-times-block");
            return Array.from(cinemaNodes).map((ele) => {
                const cinemaName = ele
                    .querySelector(".cinema-name")
                    ?.textContent?.trim();
                const dateNodes = ele.querySelectorAll(".date_block ");
                let schedules:any[] =[]
                for(const node of Array.from(dateNodes)) {
                  const dateClass = Array.from(node.classList).find(
                        (cls) => /^\d{1,2}_[A-Za-z]{3}_\w{3}_\d{4}$/.test(cls) // matches formats like 25_Jun_Wed_2025
                    );
                    const date = dateClass ?? "";
                    const attr = node
                        .querySelector(".movie-type")
                        ?.textContent?.trim();
                      for(const scheduleItem of Array.from(
                        node.querySelectorAll(".time-slot-item a h3")
                    )) {
                      schedules.push({
                        date,
                            time: scheduleItem?.textContent?.trim(),
                            attr,
                            house: "",
                      })
                    }
                }

                return {
                    cinema_name:cinemaName,
                    schedules,
                };
            });
        });

        // 获取英文
        await detailPage.goto(url.replace("/zh", "/en"), {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });
        const name_en =
            (await detailPage.locator(".movie-name").textContent()) || "";
        const { director_en, cast_en } = await extractDirectorAndCast(
            detailPage,
            "en"
        );

        return {
            ...baseInfo,
            director_hk,
            cast_hk,
            name_en,
            director_en,
            cast_en,
            poster_url_external: extractUrlFromCss(
                baseInfo.poster_url_external
            ),
            scheduleByCinemaArr,
        };
    } catch (error) {
        console.log(`source eeg 抓取电影详情页出错: ${url}`, error);
    } finally {
        await detailPage.close().catch(() => {}); // 确保关闭页面
    }
};

const scrapeInfo = async (page: Page, urls: string[]) => {
    let result: any[] = [];
    const batchSize = 3; // 每批处理3部电影
    const browserContext = page.context();
    for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        console.log(
            `source: broadway 正在处理第 ${i + 1}-${i + batch.length}/${
                urls.length
            } 部电影`
        );
        const promises = batch.map((url) => processInfo(browserContext, url));
        const batchRes = await Promise.allSettled(promises);
        batchRes.forEach((res, index) => {
            if (res.status === "fulfilled") {
                result.push(res.value);
            } else {
                console.error(
                    `source: eeg 获取电影信息失败: ${batch[index]}`,
                    res.reason
                );
                result.push(batch[index]); // 保留基本数据
            }
        });
        // 批次间暂停，避免请求过于频繁
        await page.waitForTimeout(3000);
    }
    return result;
};

const scrapeData = async (
    page: Page
): Promise<FilmItemWithSchedule[] | any> => {
    // 提取所需数据
    let infoUrls = await scrapeInfoUrls(page);

    // 提取排片表信息
    const data = await scrapeInfo(page, infoUrls);

    return data;
};

const handlers = {
    scrapeData,
};

crawler({
    urls: filmSources[FILM_SOURCE.EEG].endPoints.map((i) => i.url),
    handlers: filmSources[FILM_SOURCE.EEG].endPoints.map(
        (i) => handlers[i.handler as keyof typeof handlers]
    ),
    options: {
        headless: false, // 设置为 false 可以在开发时查看浏览器行为
        timeout: 60000, // 增加超时时间
    },
});
