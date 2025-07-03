import crawler from "../../libs/crawler";
import type { Page } from "playwright";
import filmService from "../../services/film.service";
import directorService from "../../services/director.service";
import { FilmItem } from "../../types/film";
import { Director } from "../../types/director";
import { formatNameForIMDBQuery } from "../../libs/format";
type IMDBFilmItem = {
    director_imdb_id?: string[] | null;
} & FilmItem;

const getFilmsWidthDirectorId = async () => {
    const allFilms = await filmService.getFilmData({}, [
        "film_source_id",
        "source",
        "name_en",
        "name_hk",
        "director_en",
    ]);
    if (allFilms && allFilms.length) {
        let result: IMDBFilmItem[] = [];
        for (let film of allFilms) {
            if (!film.director_en) continue;
            // director可能有多个
            const directorIds: string[] = [];
            for (const directorName of film.director_en.split(",")) {
                console.log("从数据库查询", directorName);
                const director: Director | null =
                    await directorService.getDirector({
                        name_en: directorName,
                    });
                director && directorIds.push(director.id_imdb as string);
            }

            result.push({
                ...film,
                director_imdb_id: directorIds.length ? directorIds : [],
            });
            // console.log(film.name_en, "数据库查询导演结果", directorIds);
        }

        return result;
    } else {
        return [];
    }
};

const crawlAndGetDirector = async (page: Page, film: IMDBFilmItem) => {
    let result = [];
    if (!film.director_en) return null;
    const directorNames = film.director_en.split(",");

    async function crawlDirectorId(name: string) {
        if (!name) return null;
        const formattedName = name.replace(/ /g, "%20");
        const searchUrl = `https://www.imdb.com/search/name/?name=${formattedName}`;
        // 根据导演名去 imdb 搜索，获取 imdb_id
        await page
            .goto(searchUrl, { waitUntil: "networkidle", timeout: 20000 })
            .catch(() => {
                console.log(`无法进入IMDB导演搜索页,地址是${searchUrl}`);
                return null;
            });
        await page
            .waitForSelector("ul.ipc-metadata-list", { timeout: 20000 })
            .catch(() => {
                console.log(`搜索导演未找到结果,searchUrl:${searchUrl}`);
                return null;
            });
        const director_imdb_id = await page.evaluate(() => {
            const idMatch = document
                .querySelector(
                    "ul.ipc-metadata-list li:first-child .ipc-avatar a"
                )
                ?.getAttribute("href")
                ?.match(/\/(nm\d+)/);
            return idMatch ? idMatch[1] : "";
        });

        // 将导演爬虫数据存入数据库
        if (director_imdb_id) {
            await directorService
                .addDirector({
                    id_imdb: director_imdb_id,
                    name_en: name,
                })
                .catch((error) => {
                    console.log(`新增导演数据失败,${error}`);
                });
        }
        return director_imdb_id;
    }

    for (const name of directorNames) {
        const id = await crawlDirectorId(name);
        id && result.push(id);
    }
    return result;
};

const crawlFilmDetail = async (
    page: Page,
    film: IMDBFilmItem
): Promise<IMDBFilmItem | null> => {
    if (!film.name_en) return null;
    console.log(`开始在imdb查询电影${film.name_en}`);

    const filmName = formatNameForIMDBQuery(film.name_en);
    const searchUrl = `https://www.imdb.com/search/title/?title=${filmName}&title_type=feature,short`;

    const gotoRes = await page
        .goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 })
        .catch((error) => {
            console.log(error);
        });
    if (!gotoRes) return null;

    const waitForSearchRes = await page
        .waitForSelector("ul.ipc-metadata-list", { timeout: 8000 })
        .catch((error) => {
            console.log(error);
        });
    if (!waitForSearchRes) {
        console.log(`无法找到MDB电影搜索结果元素,地址是${searchUrl}`);
        return null;
    }

    const directorIds = film.director_imdb_id;

    // 如果没有导演ID，默认第一个搜索结果
    if (!directorIds || !directorIds.length) {
        console.log(film.name_en, "导演ID一个也妹有，默认取第一个结果");
        await page.evaluate(() => {
            const detailButton = document.querySelector(
                "ul.ipc-metadata-list li:first-child button.li-info-icon"
            ) as HTMLElement;
            detailButton && detailButton.click();
        });
    } else {
        const resultButtonEles = page
            .locator("ul.ipc-metadata-list li button.li-info-icon")
            .all();
        let allButtonLocators = await resultButtonEles;
        console.log("搜索结果数量", allButtonLocators.length);
        if (!allButtonLocators.length) {
            console.log("没有搜索结果");
            return null;
        }
        // 只有一个结果，默认选择第一个结果
        if (allButtonLocators.length === 1) {
          console.log("只搜到了一个结果")
            await allButtonLocators[0].evaluate((ele: HTMLButtonElement) => {
                ele.click();
            });
        } else {
            // 前十条结果足够了
            let count = 0
            allButtonLocators =
                allButtonLocators.length > 10
                    ? allButtonLocators.slice(0, 10)
                    : allButtonLocators;
            for (const buttonLocator of allButtonLocators) {
              count++;
              console.log("当前遍历搜索结果：" + count + "/" + allButtonLocators.length)
                await buttonLocator.evaluate((ele: HTMLButtonElement) => {
                    ele.click();
                });
                // 等待详情数据请求响应
                const responsePromise = page.waitForResponse((response) =>
                    response.url().includes("Title_Summary_Prompt_From_Base")
                );
                const response = await responsePromise;
                const resData = await response.json();
                let isTarget: boolean;
                if (
                    !resData?.data?.title?.principalDirectors ||
                    !resData?.data?.title?.principalDirectors.length
                ) {
                    isTarget = false;
                    console.log("没有导演数据，非目标电影")
                } else {
                    isTarget =
                        resData?.data?.title?.principalDirectors[0]?.credits.some(
                            (item: any) => directorIds?.includes(item.name.id)
                        );
                }
                if (isTarget) {
                  console.log("找到目标电影，是第" + count + "个")
                    break;
                } else {
                    // 关闭详情框
                    await page.locator(".ipc-promptable-base__close button").evaluate((ele: HTMLButtonElement) =>{
                      ele.click()
                    })
                    console.log("搜索项匹配不成功,继续下一个");
                }
            }
        }
    }
    // TODO: 有没有更简洁的获取数据方式
    const details: any = await page.evaluate(() => {
        //获取IMDB评分
        const film_imdb_rating =
            document.querySelector(".ipc-promptable-base__content .ipc-rating-star--rating")?.textContent ||
            "";

        //获取IMDBgenre
        const genreEles = document.querySelectorAll(
            ".ipc-promptable-base__content ul[data-testid='btp_gl'] li"
        );
        let film_genres = "";
        Array.from(genreEles).forEach((ele) => {
            film_genres = film_genres + ele?.textContent + ",";
        });

        return {
            rating_imdb: Number(film_imdb_rating),
            genres: film_genres,
        };
    });

    const film_imdb_id = await page.evaluate(() => {
        const idMatch = document
            .querySelector(".ipc-promptable-base__content .ipc-poster a")
            ?.getAttribute("href")
            ?.match(/\/(tt\d+)/);
        return idMatch ? idMatch[1] : "";
    });

    const noNewData = !film_imdb_id && !details.rating_imdb && !details.genres;
    if (noNewData) {
        return null;
    }
    console.log(
        `电影${film.name_hk}抓取新数据,${details.rating_imdb},${details.genres}`
    );
    const newObj = { ...film, ...details, imdb_id: film_imdb_id };
    delete newObj.director_imdb_id;
    return newObj;
};

const imdbHandler = async (page: Page): Promise<FilmItem[]> => {
    // 遍历电影列表，去数据库查询导演名是否有存储imdb_id，若有，直接返回，若无，进入导演爬虫
    let films: IMDBFilmItem[] = await getFilmsWidthDirectorId();
    if (!films || !films.length) return [];
    console.log("获取到了电影列表", films.length);
    let results: FilmItem[] = [];

    for (let film of films) {
        // 没找到导演id，进入导演爬虫
        if (!film.director_imdb_id || !film.director_imdb_id.length) {
            film.director_imdb_id = await crawlAndGetDirector(page, film);
            console.log(
                `给电影${film.name_hk}添加了导演imdb_id:${film.director_imdb_id}`
            );
        }

        // 进入电影详情爬虫
        const crawlRes = await crawlFilmDetail(page, film);
        if (crawlRes) {
            console.log("新增爬虫结果", crawlRes);
            results.push(crawlRes);
        }
    }
    return results;
};

crawler({
    urls: "https://www.imdb.com/search/name",
    handlers: imdbHandler,
    options: {
        headless: false, // 设置为 false 可以在开发时查看浏览器行为
        timeout: 60000, // 增加超时时间
    },
});
