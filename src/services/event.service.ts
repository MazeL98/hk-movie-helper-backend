import { InferAttributes, Op } from "sequelize";
import EventModel from "../db/models/event";
import ScheduleModel from "../db/models/schedule"
import FilmModel from "../db/models/film"

export type Event = InferAttributes<EventModel>;



class EventService {
    async getUserEventWithTime(
        userID: bigint,
        startDate: string,
        endDate: string
    ) {
        try {
          const events = await EventModel.findAll({
            where: {userID},
            include:[
              {
                model:ScheduleModel,
                required:true,
                where: {
                  date: { [Op.between]: [startDate, endDate] },
                },
                attributes: ['id','cinemaName','date','time','house','attr'],
                include:[
                  {
                    model: FilmModel,
                    required:true,
                    attributes: ['id','nameHK','nameEN','nameSimplified','duration']
                  }
                ]
              }
            ]
          })


            return events.map((item) => item.toJSON()) || [];
        } catch (error) {
            console.log("查询用户的日程失败", error);
            return [];
        }
    }

    async getEvents(options?: any) {
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: { ...options },
                };
            }
            const res = await EventModel.findAll(filterOptions);
            return res.map((item) => item.toJSON()) || [];
        } catch (error) {
            console.error("查询日程出错", error);
            return [];
        }
    }
    // 为某用户添加日程
    async addEvent(data: Event) {
      console.log("service:尝试为用户添加日程",typeof data.userID)
        try {
            // TODO: 若和已有日程产生时间冲突，发出警告
            const res = await EventModel.create(data);
            return res.toJSON();
        } catch (addError) {
            console.log("添加日程失败",addError);
            throw addError;
        }
    }

    // 删除日程
    async deleteEvent(eventID: bigint) {
        if (!eventID) {
            throw new Error("缺少event ID");
        }
        try {
            const res = await EventModel.destroy({
                where: {
                    id: eventID,
                },
            });
            return res;
        } catch (deleteError) {
            console.log("删除日程失败");
            throw deleteError;
        }
    }
}

export default new EventService();
