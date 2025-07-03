import crawler from "../../libs/crawler";
import type { Page } from "playwright";
import { FilmItemWithSchedule } from "../../types/film";
import { FILM_SOURCE, filmSources } from "../../const/film_source";

// 模拟滚动加载
const scrollAndLoad = async (page: Page) => {
    let prevCount = 0,
        currCount = 0,
        noChangeCounter = 0;
    const maxTries = 5; // 连续5次滚动无变化则停止尝试
    console.log("来源Broadway开始模拟滚动加载...");

    while (noChangeCounter < maxTries) {
        prevCount = currCount;
        currCount = await page.evaluate(() => {
            const nodes = document.querySelectorAll(
                ".movie-list-main-container .movie-group-container .movie-row-container"
            );
            return nodes?.length || 0;
        });

        console.log(`当前已加载 ${currCount} 项数据`);
        if (currCount === prevCount) {
            noChangeCounter++;
            console.log(
                `没有刷出新内容，尝试次数: ${noChangeCounter}/${maxTries}`
            );
        } else {
            // 如果有新内容，重置计数器
            noChangeCounter = 0;
        }

        // 执行滚动
        await page.evaluate(() => {
            // 获取当前窗口高度
            const windowHeight = window.innerHeight;
            const totalHeight = document.body.scrollHeight;
            const currentScroll = window.scrollY;

            // 计算下一个滚动位置（随机化滚动量增加真实性）
            const scrollAmount = windowHeight * 1.9;
            const nextPosition = Math.min(
                currentScroll + scrollAmount,
                totalHeight - windowHeight
            );

            // 使用平滑滚动
            window.scrollTo({
                top: nextPosition,
                behavior: "smooth",
            });
        });

        // 等待数据加载
        await page.waitForTimeout(4000);
    }

    console.log(`来源Broadway的所有电影数据加载完成，共 ${currCount} 项数据`);
};

const processDetail = async (
    browserContext: any,
    film: FilmItemWithSchedule
) => {
    if (!film.film_source_id) return film;
    const detailPage = await browserContext.newPage();
    try {
        const detailUrl = `https://www.cinema.com.hk/tc/movie/details/${film.film_source_id}`;
        await detailPage.goto(detailUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });
        await detailPage
            .waitForSelector("#content", { timeout: 60000 })
            .catch(() => {
                console.log(
                    `source broadway 无法找到电影详情元素: ${film.film_source_id},语言是粤语`
                );
            });
        const details_hk = await detailPage.evaluate(() => {
          let poster_url_external:string | null | undefined = ''
          // 先取懒加载的属性，若没有则尝试正常取
          poster_url_external = document.querySelector('.movie-image-container img')?.getAttribute('date-src')
          if(!poster_url_external) {
            poster_url_external = document.querySelector('.movie-image-container img')?.getAttribute('src')
          }
            const director_hk =
                document
                    .querySelector(
                        ".movie-info-right-col .movie-director-title"
                    )
                    ?.nextSibling?.textContent?.trim() || "";
            const cast_hk =
                document
                    .querySelector(
                        ".movie-info-right-col .movie-artist-container table tbody tr td:last-child"
                    )
                    ?.textContent?.trim() || "";
            return {
                director_hk,
                cast_hk,
                poster_url_external
            };
        });
        await detailPage.goto(
            `https://www.cinema.com.hk/en/movie/details/${film.film_source_id}`,
            {
                waitUntil: "domcontentloaded",
                timeout: 60000,
            }
        );
        await detailPage
            .waitForSelector("#content", { timeout: 60000 })
            .catch(() => {
                console.log(
                    `source broadway 无法找到电影详情元素: ${film.film_source_id},语言是英语`
                );
            });
        const name_en =
            (await detailPage
                .locator(".movie-info-right-col .movie-header")
                .textContent()) || "";
        const director_en = await detailPage
            .locator(".movie-info-right-col .movie-director-title")
            .evaluate((ele: any) => {
                return ele?.nextSibling?.textContent?.trim() || "";
            });
        const cast_en =
            (await detailPage
                .locator(
                    ".movie-info-right-col .movie-artist-container table tbody tr td:last-child"
                )
                .textContent()) || "";
        return { ...film, ...details_hk, name_en, cast_en, director_en };
    } catch (error) {
        console.log(
            `source broadway 抓取电影详情页出错: ${film.name_hk}`,
            error
        );
    } finally {
        await detailPage.close().catch(() => {}); // 确保关闭页面
    }
};

const scrapeBaseContent = async (page: Page) => {
    const data = await page
        .locator(
            ".movie-list-main-container .movie-group-container .movie-row-container"
        )
        .evaluateAll((eles) => {
            const baseData = eles.map((ele) => {
                // 获取电影名称
                const name_hk =
                    ele
                        .querySelector(
                            ".movie-detail-upper-container .movie-name a"
                        )
                        ?.textContent?.trim() || "";

                // 获取二级信息
                const on_screen_date =
                    ele
                        .querySelector(".movie-opening-day")
                        ?.textContent?.replace(/\n/g, "")
                        ?.trim() || "";
                const duration =
                    ele.querySelector(".movie-duration")?.textContent?.trim() ||
                    "";
                const language =
                    ele.querySelector(".movie-language")?.textContent || "";

                //获取排片信息
                const cinemaRows = ele.querySelectorAll(".cinema-row");
                const scheduleByCinemaArr = Array.from(cinemaRows).map(
                    (row) => {
                        const cinema_name =
                            row
                                .querySelector(".cinema-name a")
                                ?.textContent?.trim() || "";
                        const htmlStrings = Array.from(
                            row.querySelectorAll(
                                ".movie-schedule-dropdown option"
                            )
                        )?.map((item) =>
                            item?.getAttribute("data-selectedtext")
                        );
                        const parser = new DOMParser();
                        const scheduleArray = htmlStrings.map((str) => {
                            if (!str) return {};
                            const doc = parser.parseFromString(
                                str,
                                "text/html"
                            );
                            const date = doc
                                .querySelector(".movie-schedule-date")
                                ?.textContent?.trim();
                            const scheduleTimeElement = doc.querySelector(
                                ".movie-schedule-time"
                            );
                            const time =
                                scheduleTimeElement?.textContent?.trim();
                            const attr1 = scheduleTimeElement
                                ?.querySelector(".show-attribute")
                                ?.textContent?.trim();
                            const attr2 = doc
                                .querySelector(
                                    ".more_movie_attribute_desciption"
                                )
                                ?.textContent?.trim();
                            const house = doc
                                .querySelector(".movie-schedule-house-no")
                                ?.textContent?.trim();
                            return {
                                attr: attr1 + "," + attr2,
                                house,
                                date,
                                time,
                            };
                        });
                        return {
                            cinema_name,
                            schedules: scheduleArray,
                        };
                    }
                );

                return {
                    name_hk,
                    on_screen_date,
                    duration,
                    language: language?.replace(/\n/g, "").trim(),
                    film_source_id: Number(ele.id) || 0,
                    scheduleByCinemaArr,
                    poster_url_internal: "",
                    source: 0,
                };
            });
            return baseData;
        });
    return data;
};

const scrapeDetails = async (page: Page, data: any[]) => {
    console.log(`source: broadway 获取到 ${data?.length} 条电影列表数据`);
    let result: any[] = [];
    const batchSize = 5; // 每批处理5部电影
    const browserContext = page.context();
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        console.log(
            `source: broadway 正在处理第 ${i + 1}-${i + batch.length}/${
                data.length
            } 部电影`
        );
        const promises = batch.map((film) =>
            processDetail(browserContext, film)
        );
        const batchRes = await Promise.allSettled(promises);
        batchRes.forEach((res, index) => {
            if (res.status === "fulfilled") {
                result.push(res.value);
            } else {
                console.error(
                    `source: broadway 获取电影详情失败: ${batch[index].film_source_id}`,
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

const scrapeData = async (page: Page): Promise<FilmItemWithSchedule[] | any> => {
    await scrollAndLoad(page);
    // 提取所需数据
    console.log("开始提取broadway粤语数据");
    let data = await scrapeBaseContent(page);

    // 提取排片表信息
    data = await scrapeDetails(page, data);
    console.log("broadway数据提取完成", data);
    return data;
};

const handlers = {
    scrapeData,
};

crawler({
    urls: filmSources[FILM_SOURCE.BROADWAY].endPoints.map((i) => i.url),
    handlers: filmSources[FILM_SOURCE.BROADWAY].endPoints.map(
        (i) => handlers[i.handler as keyof typeof handlers]
    ),
    options: {
        headless: false, // 设置为 false 可以在开发时查看浏览器行为
        timeout: 60000, // 增加超时时间
    },
});
