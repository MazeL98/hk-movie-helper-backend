import crawler from "../../libs/crawler";
import type { Page } from "playwright";
import { FilmItem } from "../../types/film";
import { FILM_SOURCE, filmSources } from "../../const/film_source";

const mergeArrays = (array1: Array<any>, array2: Array<any>) => {
    const map = new Map();

    // Add all objects from array1 to the map
    array1.forEach((item: any) => map.set(item.filmSourceID, { ...item }));

    // Update or add objects from array2
    array2.forEach((item: any) => {
        if (map.has(item.filmSourceID)) {
            Object.assign(map.get(item.filmSourceID), item); // Merge properties
        } else {
            map.set(item.filmSourceID, { ...item }); // Add new object
        }
    });

    // Convert map back to array
    return Array.from(map.values());
};

const clickAndLoad = async (page: Page) => {
    await page
        .waitForSelector(".Festival_Films .show_more a", { timeout: 10000 })
        .catch(() => {
            console.log("未找到'显示更多'按钮或等待超时");
        });

    // 使用Promise处理点击过程
    await page.evaluate(() => {
        return new Promise<void>((resolve) => {
            const showMoreBtn = document.querySelector(
                ".Festival_Films .show_more a"
            ) as HTMLElement;
            let clickAttempts = 0;
            const maxAttempts = 40; // 最大尝试次数，防止无限循环

            const clickUntilHidden = () => {
                if (!showMoreBtn) {
                    console.log("未找到'显示更多'按钮");
                    return resolve();
                }
                // 检查按钮是否存在且可见
                if (
                    showMoreBtn &&
                    window.getComputedStyle(showMoreBtn).display !== "none" &&
                    clickAttempts < maxAttempts
                ) {
                    try {
                        showMoreBtn.click();
                        clickAttempts++;
                        console.log(
                            `点击"显示更多"按钮 ${clickAttempts}/${maxAttempts}`
                        );
                        setTimeout(clickUntilHidden, 200); // 增加间隔以确保内容加载
                    } catch (err) {
                        console.error("点击过程中发生错误:", err);
                        resolve(); // 出错时结束
                    }
                } else {
                    // 按钮不存在、不可见或达到最大尝试次数
                    console.log("所有内容已加载完成，不再显示更多按钮");
                    resolve();
                }
            };

            clickUntilHidden();
        });
    });
};

// 获取中文基础数据
const getBaseInfoHK = async (page: Page): Promise<FilmItem[]> => {
    const result = await page.evaluate(() => {
        const getNameText = (ele: Element) => {
            return (
                ele.querySelector(".box .intro h1")?.textContent?.trim() || ""
            );
        };
        const getDirectorText = (ele: Element) => {
            return (
                ele.querySelector(".box .intro h2 span")?.textContent?.trim() ||
                ""
            );
        };
        const filmContainers = document.querySelectorAll(
            ".Festival_Films_list .cube  a"
        );
        return Array.from(filmContainers).map((container) => {
            // 截取ID
            const source_id =
                container.getAttribute("href")?.split("?fid=")[1] || 0;
            // 获取海报图片和电影名称
            const posterUrlExternal =
                container.querySelector(".box .img img")?.getAttribute("src") ||
                "";

            const nameHK = getNameText(container);
            const directorHK = getDirectorText(container);

            return {
                filmSourceID: Number(source_id) || 0,
                nameHK,
                posterUrlExternal,
                onScreenDate: "",
                duration: "",
                language: "",
                posterUrlInternal: "",
                directorHK,
                source: 0
            };
        });
    });
    return result;
};

// 获取英文基础数据
const getBaseInfoEN = async (page: Page) => {
    const result = await page.evaluate(() => {
        const getNameText = (ele: Element) => {
            return (
                ele.querySelector(".box .intro h1")?.textContent?.trim() || ""
            );
        };
        const getDirectorText = (ele: Element) => {
            return (
                ele.querySelector(".box .intro h2 span")?.textContent?.trim() ||
                ""
            );
        };
        const filmContainers = document.querySelectorAll(
            ".Festival_Films_list .cube  a"
        );
        return Array.from(filmContainers).map((container) => {
            // 截取ID
            const source_id =
                container.getAttribute("href")?.split("?fid=")[1] || 0;
            const nameEN = getNameText(container);
            const directorEN = getDirectorText(container);
            return {
                filmSourceID: Number(source_id) || 0,
                nameEN,
                directorEN,
            };
        });
    });
    return result;
};

// 从详情里获取更多信息
const processDetail = async (browserContext: any, film: FilmItem,lang: 'hk' | 'en') => {
  if(!film.filmSourceID) return film;
    // 创建新页面而非复用主页面
    const detailPage = await browserContext.newPage();
    try {
      const detailUrl = `https://www.hkiff.org.hk/film/getdetail?fid=${film.filmSourceID}`;
        // 访问详情页
        await detailPage.goto(detailUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });  
        await detailPage.waitForSelector('main .content', { timeout: 60000 }).catch(() => {
          console.log(`source hkiff 无法找到电影详情元素: ${film.filmSourceID},语言是${lang}`);
        });
        const details= await detailPage.evaluate((lang: 'hk' | 'en') =>{

          if(lang === 'hk') {
            // 获取语言和时长属性
            const matchString = (rawString:String) =>{
              let duration = "",language = "";
              if(!rawString.length) return {duration,language}
              const arr = rawString.split('/')
              if(lang === 'hk') {
                arr.forEach((item) => {
                  if(item.includes('分鐘')){
                    duration = item
                  }
                  if(item.includes('語') || item.includes('話')){
                    language += item.trim()
                  }
                  if(item.includes('字幕')){
                    language += '(' +  item.trim() + ')'
                  }
                })
              } else {
                arr.forEach((item,index) => {
                  if(item.includes('minutes')){
                    duration = item.split('minutes')[0].trim()
                  }
                  if((index === 1 || index === 2) && !/\d/.test(item)){
                    language += item.trim()
                  }
                })
              }
              return {duration,language}
            }
            const rawString = document.querySelector('main .leftPart .intro p:first-child')?.textContent?.trim() || '';
            const {duration,language} = matchString(rawString)
  
            const directorHK = document.querySelector('main .leftPart .flex-row div:first-child p:last-child')?.textContent?.trim() || '';
            const castHK = document.querySelector('main .leftPart .flex-row div:first-child p:last-child')?.textContent?.trim() || '';
            return {
              directorHK,
              castHK,
              duration,
              language
            }
          } else {
            const directorEN = document.querySelector('main .leftPart .flex-row div:first-child p:last-child')?.textContent?.trim() || '';
            const castEN =document.querySelector('main .leftPart .flex-row div:first-child p:last-child')?.textContent?.trim() || '';
            return {
              directorEN,
              castEN
            }
          }

          
        })
        return {...film,...details}
    
    } catch (error) {
      console.error(`source hkiff 抓取电影详情页出错: ${film.filmSourceID},语言是${lang}`, JSON.stringify(error));
      } finally{
        await detailPage.close().catch(() => {}); // 确保关闭页面
      }
}

const scrapeDetails = async (page: Page, data: any[],lang: 'en' | 'hk') => {

  console.log(`source: hkiff 获取到 ${data?.length} 条电影列表数据`);
  let result: any[] = []
  const batchSize = 5; // 每批处理5部电影
  const browserContext = page.context();
  for(let i = 0; i < data.length;i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`source: hkiff  正在处理第 ${i+1}-${i+batch.length}/${data.length} 部电影,语言是${lang}`);
    const promises = batch.map(film => processDetail(browserContext,film,lang))
    const batchRes = await Promise.allSettled(promises)
    batchRes.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        result.push(res.value);
      } else {
        console.error(`source: hkiff 获取电影详情失败: ${batch[index].filmSourceID},语言是${lang}`, res.reason);
        result.push(batch[index]); // 保留基本数据
      }
    });
      // 批次间暂停，避免请求过于频繁
      await page.waitForTimeout(2000);

  }
  return result;
}

const scrapeData = async (page: Page): Promise<FilmItem[]> => {
    await page.evaluate(() => {
        if (document.documentElement.lang === "en") {
            const btn = document.querySelector(
                ".language > a:first-child"
            ) as HTMLElement;
            if (btn) {
                btn.click();
            }
        }
    });
    console.log(`开始加载来源HKIFF的电影数据...`);

    await clickAndLoad(page);

    let infoHK = await getBaseInfoHK(page);
    // 获取详情
    infoHK = await scrapeDetails(page,infoHK,'hk')

    // 切换语言
    await page.evaluate(() => {
        const btn = document.querySelector(
            ".language > a:first-child"
        ) as HTMLElement;
        if (btn) {
            btn.click();
        }
    });

    // 获取英文内容
    await clickAndLoad(page);
    let infoEN = await getBaseInfoEN(page);
    // 获取详情
    infoEN = await scrapeDetails(page,infoEN,'en');
    const mergedInfo = mergeArrays(infoHK, infoEN);
    
    return mergedInfo
};

const handlers = {
    scrapeData: scrapeData,
};

crawler({
    urls: filmSources[FILM_SOURCE.HKIFF].endPoints.map((i) => i.url),
    handlers: filmSources[FILM_SOURCE.HKIFF].endPoints.map(
        (i) => handlers[i.handler as keyof typeof handlers]
    ),
    options: {
        headless: false, // 设置为 false 可以在开发时查看浏览器行为
        timeout: 60000, // 增加超时时间
    },
});
