import { startCrawlerProcess, qiniuUpload } from "../libs/utils";

import {
    FilmItemWithSchedule,
    SaveAndUploadFilmRes,
    ScheduleByCinema,
} from "../types/film";
import { FILM_SOURCE } from "../const/film_source";
import { filmCrawlerScripts } from "../const/film_script";
import { QI_NIU } from "../config/config.qiniu";

import filmService from "../services/film.service";
import scheduleService from "../services/schedule.service";

import { parseScheduleDate, parseScheduleTime } from "../libs/format";
import { logTitle } from "../libs/log";

class Crawler {
    // 爬取影院网站数据
    async crawlAllFilmsFromCinema() {
        const results = await Promise.allSettled(
            filmCrawlerScripts.map(({ source, path }) =>
                this._crawlFilmBySource({ source, path })
            )
        );

        // 统计结果
        const succeeded = results.filter(
            (r) => r.status === "fulfilled"
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;
        console.log(
            `爬虫运行完成: ${succeeded} 个来源成功, ${failed} 个来源失败`
        );
        return results;
    }

    // 爬取单个来源的数据
    private _crawlFilmBySource({
        source,
        path,
    }: {
        source: FILM_SOURCE;
        path: string;
    }) {
        return new Promise((resolve, reject) => {
            startCrawlerProcess({
                path,
                message: async (data: any) => {
                    if (!Array.isArray(data)) {
                        reject(
                            `来源 ${source} 爬虫数据获取错误: ${JSON.stringify(
                                data
                            )}`
                        );
                        return;
                    }

                    try {
                        let result: SaveAndUploadFilmRes =
                            await this._processFilmData(data, source);
                        // 上传图片
                        console.log(
                            "准备上传海报的电影数目",
                            result.data.length
                        );
                        const { success, failed } = await this._uploadPoster(
                            result.data
                        );
                        result.uploadSuccess = success;
                        result.uploadFailed = failed;
                        delete result.data;
                        resolve(result);
                    } catch (error) {
                        reject(
                            `来源 ${source} 执行processFilmData错误: ${error}`
                        );
                    }
                },
                exit: (code: any) => {
                    console.log("子进程已退出", code);
                    if (code !== 0) {
                        reject(`子进程非正常退出，退出码: ${code}`);
                    }
                },
                error: (err: any) => {
                    console.log("子进程发生异常", err);
                    reject(`子进程发生异常: ${err}`);
                },
            });
        });
    }

    private async _filterAndSaveSchedule(
        data: ScheduleByCinema[],
        targetID: bigint,
        source: FILM_SOURCE
    ) {
      console.log("按照电影院添加排片",targetID,typeof targetID);
        if (!data || !Array.isArray(data) || !targetID) return;
        for (const cinemaItem of data) {
            const { cinemaName } = cinemaItem;
            for (const schedule of cinemaItem.schedules) {
                let { date, time, attr, house } = schedule;
                if (!date || !time) continue;
                date = parseScheduleDate(date, source);
                time = parseScheduleTime(time, source);
                try {
                    await scheduleService.addSchedule({
                        filmID: targetID,
                        cinemaName,
                        date,
                        time,
                        house,
                        attr,
                    });
                } catch (error) {
                    console.log(`添加排片出错,${error}`);
                }
            }
        }
    }
    // 电影数据入库
    private async _processFilmData(
        data: FilmItemWithSchedule[],
        source: FILM_SOURCE
    ) {
        // 统计变量
        let success = 0;
        let failed = 0;
        const reasons = [];
        const newData = [];
        logTitle("开始添加电影条目");

        for (const item of data) {
            try {
                item.source = source;

                const { scheduleByCinemaArr, ...baseInfo } = item;
                let searchRes = await filmService.searchByName(
                    baseInfo.nameHK
                );

                if (!searchRes || !searchRes.id) {
                  console.log("找不到该条目，准备添加")
                    const addRes = await filmService.addFilmData(baseInfo);
                    if (!addRes || !addRes.id) {
                      console.log(baseInfo.nameHK,"添加条目失败")
                        failed++;
                        continue;
                    }
                    searchRes = addRes;
                }
                console.log(searchRes?.id,typeof searchRes?.id)
                newData.push({
                    id: searchRes?.id,
                    nameHK: item.nameHK,
                    posterUrlExternal: item.posterUrlExternal,
                });

                // 添加排片
                scheduleByCinemaArr &&
                    (await this._filterAndSaveSchedule(
                        scheduleByCinemaArr,
                        searchRes.id as bigint,
                        source
                    ));
                success++;
            } catch (error: any) {
                failed++;
                // 详细记录错误
                reasons.push({
                    name: item.nameHK,
                    error: error.message,
                });
            }
        }
        console.log(`数据入库完成: ${success} 成功, ${failed} 失败`);

        // if (failed > 0) {
        //     console.error(`失败详情:`, reasons);
        // }
        return {
            source,
            data: newData,
            success,
            failed,
        };
    }

    private async _uploadPoster(
        data: { nameHK: string; posterUrlExternal?: string }[]
    ) {
        // 将静态资源上传到七牛云生成新path
        // 保存当前的代理设置
        console.log("开始执行upload");
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

        try {
            let success = 0,
                failed = 0;
            await Promise.allSettled(
                data.map(async (item) => {
                    // 将海报图片存为静态资源
                    if (item.posterUrlExternal) {
                        try {
                            const resData = await qiniuUpload({
                                url: item.posterUrlExternal,
                                bucket: QI_NIU.buckets.cineplan.bucket_name,
                                ext: ".jpg",
                                access_key: QI_NIU.keys.ACCESS_KEY,
                                secret_key: QI_NIU.keys.SECRET_KEY,
                            });
                            console.log("上传结果", JSON.stringify(resData));
                            if (resData.data) {
                                // 数据库中更新url属性
                                try {
                                    await filmService.updateFilmData({
                                        nameHK: item.nameHK,
                                        posterUrlInternal:
                                            QI_NIU.buckets.cineplan.domain +
                                            "/" +
                                            resData.data,
                                    });
                                    success++;
                                } catch (error) {
                                    failed++;
                                    console.error(
                                        `图片入库失败: ${item.nameHK} ${error}`
                                    );
                                }

                                return;
                            }
                        } catch (error) {
                            failed++;
                            console.error(
                                `上传图片失败: ${item.nameHK} ${error}`
                            );
                            return null;
                        }
                    }
                    return null;
                })
            );
            return {
                success,
                failed,
            };
        } finally {
            // 恢复代理设置
            process.env.HTTP_PROXY = originalHttpProxy;
            process.env.HTTPS_PROXY = originalHttpsProxy;
            process.env.NODE_TLS_REJECT_UNAUTHORIZED =
                originalNodeTlsRejectUnauthorized;
        }
    }

    // 从豆瓣查询电影数据
    async crawlFilmFromDouban() {
        return new Promise((resolve, reject) => {
            startCrawlerProcess({
                path: "../crawlers/douban/douban.crawler.ts",
                message: async (data: any) => {
                    console.log("接收到豆瓣子进程数据", data);
                    if (!Array.isArray(data)) {
                        reject(`爬取豆瓣数据发生错误: ${data}`);
                        return;
                    }
                    // 豆瓣数据入库
                    try {
                        //TODO: 处理豆瓣数据
                        data.forEach((item) =>
                            filmService.updateFilmData(item)
                        );
                        resolve({
                            source: "豆瓣",
                            total: data.length,
                            msg: "爬取豆瓣数据并更新到数据库",
                        });
                    } catch (error) {
                        reject(`处理豆瓣数据发生错误: ${data}`);
                    }
                },
                exit: (code: any) => {
                    console.log("豆瓣爬取子进程已退出", code);
                },
                error: (err: any) => {
                    console.log("豆瓣爬取子进程发生异常并退出", err);
                },
            });
        });
    }

    // 从IMDB查询电影数据
    async crawlFilmFromImdb() {
        return new Promise((resolve, reject) => {
            startCrawlerProcess({
                path: "../crawlers/imdb/imdb.crawler.ts",
                message: async (data: any) => {
                    console.log("接收到IMDB子进程数据", data);
                    if (!Array.isArray(data)) {
                        reject(`爬取IMDB数据发生错误: ${data}`);
                        return;
                    }
                    // IMDB数据入库
                    try {
                        data.forEach((item) =>
                            filmService.updateFilmData(item)
                        );
                        resolve({
                            source: "IMDB",
                            total: data.length,
                            msg: "爬取IMDB数据并更新到数据库",
                        });
                    } catch (error) {
                        reject(`处理IMDB数据发生错误: ${data}`);
                    }
                },
                exit: (code: any) => {
                    console.log("IMDB爬取子进程已退出", code);
                    if (code !== 0) {
                        reject(`处理MDB数据因异常而退出: ${code}`);
                    }
                },
                error: (err: any) => {
                    console.log("IMDB爬取子进程发生异常并退出", err);
                    reject(`处理MDB数据发生错误: ${err}`);
                },
            });
        });
    }
}

export default new Crawler();
