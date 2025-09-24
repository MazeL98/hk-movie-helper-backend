import { InferAttributes, Op } from "sequelize";
import EventModel from "../db/models/event";

export type Event = InferAttributes<EventModel>;


class EventService {
    //按用户按日期区间查询日程
    async getEventByUserBetween(userID:bigint,startDate:string,endDate:string){
       const options: any = {};
            // 构建日期条件
            if (startDate || endDate) {
                options.date = {};
                if (startDate) options.date[Op.gte] = startDate;
                if (endDate) options.date[Op.lte] = endDate;
            }
            if(userID) options.userID = userID
           try {
             const res = await EventModel.findAll({
              where: options
            })
            return res.map((item) => item.toJSON()) || [];
           } catch (error) {
            console.log("按用户日期区间查询日程失败",JSON.stringify(error))
            return []
          }
    }
    async getEvent(options?: any) {
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: { ...options },
                };
            }
            const res =await EventModel.findAll(filterOptions);
            return res.map((item) => item.toJSON()) || [];
        } catch (error) {
          console.error("查询日程出错",JSON.stringify(error))
          return []
        }
    }
    // 为某用户添加日程
    async addEvent(data: Event) {
        if (!data.userID) {
            throw new Error("缺少用户ID");
        } else if (!data.scheduleID) {
            throw new Error("缺少排片信息");
        }

        try {
            // TODO: 若和已有日程产生时间冲突，发出警告
            await EventModel.create(data);
        } catch (addError) {
            console.log("添加日程失败");
            throw addError;
        }
    }

    // 删除日程
    async deleteEvent(eventId: number) {
        if (!eventId) {
            throw new Error("缺少event ID");
        }
        try {
            await EventModel.destroy({
                where: {
                    id: eventId,
                },
            });
        } catch (deleteError) {
            console.log("删除日程失败");
            throw deleteError;
        }
    }
}

export default new EventService();
