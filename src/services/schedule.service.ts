import { Op, InferAttributes } from "sequelize";
import ScheduleModel from "../db/models/schedule";
import EventModel from "../db/models/event";
import cinemaService from "./cinema.service";

type Schedule = InferAttributes<ScheduleModel>;

class ScheduleService {
    async queryCinemaId(data: Schedule) {
        // 爬虫数据没有添加cinema_id，只爬取了cinema_name，需要跨表查询
        const cinemaRes = await cinemaService.queryCinemaID(data.cinemaName);
        if (cinemaRes && cinemaRes.id) {
            data.cinemaID = cinemaRes.id;
            console.log(`添加了${data.cinemaName}的id`);
        } else {
            console.log(`没有在数据库找到${data.cinemaName}的id，添加字段失败`);
        }
    }

    async addSchedule(data: Schedule) {
        const target = await ScheduleModel.findOne({
            where: {
                filmID: data.filmID,
                date: data.date,
                time: data.time,
                attr: data.attr,
                cinemaName: data.cinemaName,
            },
        });
        if (!data.cinemaID) {
            await this.queryCinemaId(data);
        }
        if (!target) {
          try {
            console.log("添加排片前最后检查数据",data)
            const res = await ScheduleModel.create(data);
            console.log("添加排片结果",res)
            console.log("添加排片成功", data.filmID);
          } catch (addError) {
              console.error(
                    "添加排片时发生错误",
                    addError
                );
                throw addError;
          }
            
            
        } else {
            console.log("找到相似的排片结果");
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
                    updateError
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
               error
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
                error
            );
            return [];
        }
    }

    // 查询符合日期范围的
    async getSchedulesBetween(
        startDate?: string,
        endDate?: string,
        filmId?: number
    ) {
        try {
            const options: any = {};
            // 构建日期条件
            if (startDate || endDate) {
                options.date = {};
                if (startDate) options.date[Op.gte] = startDate;
                if (endDate) options.date[Op.lte] = endDate;
            }
            if (filmId) options.film_id = filmId;
            const res = await ScheduleModel.findAll({
                where: options,
            });
            return res.map((item) => item.toJSON()) || [];
        } catch (error) {
            console.error(
                "从数据库按照dateRange获取排片数据时发生错误",
                error
            );
            return [];
        }
    }

    // 根据scheduleID和时间范围联表event-userID查找
    async getUserSchedulesInRange(
        userID: bigint,
        startDate: string,
        endDate: string
    ) {
        try {
            const res =await ScheduleModel.findAll({
                include: [
                    {
                        model: EventModel,
                        where: { user_id: userID },
                        attributes: [],
                    },
                ],
                where: {
                    date: { [Op.between]: [startDate, endDate] },
                },
            });
             return res.map((item) => item.toJSON()) || [];
        } catch (err) {
          console.error(
                "联表查询用户日程失败",
                err
            );
            return [];
        }
    }
}

export default new ScheduleService();
