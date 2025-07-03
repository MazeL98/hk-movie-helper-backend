import { Op, InferAttributes } from "sequelize";
import ScheduleModel from "../db/models/schedule";
import cinemaService from "./cinema.service";


type Schedule = InferAttributes<ScheduleModel>;

class ScheduleService {
    async queryCinemaId(data: Schedule) {
        // 爬虫数据没有添加cinema_id，只爬取了cinema_name，需要跨表查询
        const cinemaRes = await cinemaService.getCinemaByFuzzyQuery(
            { name_hk: data.cinema_name },
            ["id"]
        );
        if (cinemaRes && cinemaRes.id) {
            data.cinema_id = cinemaRes.id;
            console.log(`添加了${data.cinema_name}的id`);
        } else {
            console.log(
                `没有在数据库找到${data.cinema_name}的id，添加字段失败`
            );
        }
    }

    // async queryFilmId(data: Schedule) {
    //     const filmRes = await filmService.getOneFilm(
    //         {
    //             source: Number(data.source),
    //             film_source_id: Number(data.film_source_id),
    //         },
    //         ["id"]
    //     );
    //     if (filmRes && filmRes.id) {
    //         data.film_id = filmRes.id;
    //     } else {
    //         console.log(
    //             `没有在数据库找到${data.film_source_id} source${data.source}的film_id，添加字段失败`
    //         );
    //     }
    // }

    async addSchedule(data: Schedule) {
      console.log("执行addSchedule")
        const target = await ScheduleModel.findOne({
            where: {
              film_id:data.film_id,
                date: data.date,
                time: data.time,
                attr:data.attr,
                cinema_name: data.cinema_name,
            },
        });
        if (!data.cinema_id) {
            await this.queryCinemaId(data);
        }
        if (!target) {
            await ScheduleModel.create(data);
            console.log("添加排片成功", data.film_id);
        } else {
          console.log("找到相似的排片结果")
            try {
                // 只更新非undefined/null的字段
                for (const [key, value] of Object.entries(data)) {
                    if (value !== undefined && value !== null) {
                        target.set(key as keyof Schedule, value);
                    }
                }
                await target.save();
            } catch (updateError) {
                console.error(
                    "更新数据时发生错误",
                    JSON.stringify(updateError)
                );
                throw updateError;
            }
        }
    }
    // 查询单条结果
    async getSchedule(options?: any) {
        // console.log("查询条件",options)
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: { ...options },
                };
            }
            const res = await ScheduleModel.findOne(filterOptions);
            // console.log("查询结果",res)
            return res ? res.toJSON() : null;
        } catch (error) {
            console.error(
                "从数据库获取排片数据时发生错误",
                JSON.stringify(error)
            );
            return null;
        }
    }
    // 查询多条结果
    async getSchedules(options?: any) {
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: { ...options },
                };
            }
            const res = await ScheduleModel.findAll(filterOptions);
            return res.map((item) => item.toJSON()) || [];
        } catch (error) {
            console.error(
                "从数据库获取排片数据时发生错误",
                JSON.stringify(error)
            );
            return [];
        }
    }

    // 查询符合日期范围的
    async getSchedulesBetween(
        startDate: string,
        endDate: string,
        filmId?: number
    ) {
        try {
            const options:any = {
                date: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate,
                },
            };
            if(filmId) options.film_id=filmId
            const res = await ScheduleModel.findAll({
                where: options,
            });
            return res.map((item) => item.toJSON()) || [];
        } catch (error) {
            console.error(
                "从数据库按照dateRange获取排片数据时发生错误",
                JSON.stringify(error)
            );
            return [];
        }
    }
}

export default new ScheduleService();
