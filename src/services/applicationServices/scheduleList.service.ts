import { InferAttributes } from "sequelize";
import ScheduleModel from "../../db/models/schedule";
import cinemaService from "../cinema.service";
import filmService from "../film.service";
import scheduleService from "../schedule.service";
import { isValidDateFormat } from "../../libs/format";
type Schedule = InferAttributes<ScheduleModel>;
import dayjs from "dayjs";
class ScheduleListService {
    // 查询某个影院的所有电影的排片
    async getSchedulesByCinema(cinemaId: number, date: string) {
        if (!cinemaId || !date) {
            console.log(`getSchedulesByCinema缺少参数`);
            return null;
        }
        if (!isValidDateFormat(date)) {
            console.log("date is invalid");
            return null;
        }
        let result: any;
        // 组装cinema info
        const cinemaInfo = await cinemaService.getCinema({ id: cinemaId });
        if (!cinemaInfo) return null;
        console.log("cinemaInfo", JSON.stringify(cinemaInfo));
        result = { ...cinemaInfo, scheduleByFilm: [] };

        const rawSchedules = await scheduleService.getSchedules({
            cinema_id: cinemaId,
            date: date,
        });
        console.log("rawSchedules", rawSchedules);
        if (!rawSchedules) return result;

        // 组装 film info + schedules
        const filmMap = new Map();

        for (const schedule of rawSchedules) {
            if (!filmMap.get(schedule.film_id)) {
                // 添加film info
                const filmInfo = await filmService.getOneFilm({
                    id: schedule.film_id,
                });
                // 找不到schedule对应的film就放弃该schedule
                if (!filmInfo) continue;
                filmMap.set(schedule.film_id, {
                    ...filmInfo,
                    schedules: [schedule],
                });
            } else {
                const filmObj = filmMap.get(schedule.film_id);
                filmObj.schedules.push(schedule);
            }
        }
        result.scheduleByFilm = Array.from(filmMap.values());

        return result;
    }

    // 查询某个电影的所有影院的排片
    async getSchedulesByFilm(filmId: number, date: string) {
        if (!filmId || !date || !isValidDateFormat(date)) return null;
        let result: any;
        // 组装 film info
        const filmInfo = await filmService.getOneFilm({ id: filmId });
        if (!filmInfo) return null;
        result = { ...filmInfo, scheduleByCinema: [] };
        console.log("filmInfo", filmInfo);
        const rawSchedules = await scheduleService.getSchedules({
            film_id: filmId,
            date: date,
        });
        if (!rawSchedules) return result;

        // 组装 cinema info + schedules
        const cinemaMap = new Map();
        for (const schedule of rawSchedules) {
            const cinemaObj = cinemaMap.get(schedule.cinema_id);
            if (cinemaObj) {
                cinemaObj.schedules.push(schedule);
            } else {
                const cinemaInfo = await cinemaService.getCinema({
                    id: schedule.cinema_id,
                });
                if (!cinemaInfo) continue;
                cinemaMap.set(schedule.cinema_id, {
                    ...cinemaInfo,
                    schedules: [schedule],
                });
            }
        }
        result.scheduleByCinema = Array.from(cinemaMap.values());

        return result;
    }
    // 查询日期范围内的排片，并按照 film 返回
    async getSchedulesByDateRange([startDate, endDate]: string[]) {
        if (!startDate || !endDate) return null;
        if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
            console.log("Error in getSchedulesByDateRange: date is invalid");
            return;
        }
        // 查找符合时间范围的所有排片，按电影来返回
        let result: any;
        const rawSchedules = await scheduleService.getSchedulesBetween(
            startDate,
            endDate
        );
        console.log("rawSchedules", rawSchedules);
        if (!rawSchedules) return [];
        const filmMap = new Map();
        for (const schedule of rawSchedules) {
            const filmObj = filmMap.get(schedule.film_id);
            if (!filmObj) {
                const filmInfo = await filmService.getOneFilm({
                    id: schedule.film_id,
                });
                if (!filmInfo) continue;
                filmMap.set(schedule.film_id, {
                    ...filmInfo,
                });
            }
        }
        result = Array.from(filmMap.values());
        return result;
    }
    async getScheduleDatesForCinema( cinemaId:number) {
     if (!cinemaId ) return null;
             const rawSchedules = await scheduleService.getSchedules({
            cinema_id: cinemaId,
        });
        if (!rawSchedules) return [];
        console.log(new Date('2024-05-02'))
        return  [...new Set(rawSchedules.map((item:any) => item.date))].sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());
    }
    // 查询某个电影的排片日期
    async getScheduleDatesForFilm(
        filmId: number,
        start?: string,
        end?: string
    ) {
        if (!filmId) return null;
        let rawSchedules: any = [];
        if (
            start &&
            isValidDateFormat(start) &&
            end &&
            isValidDateFormat(end)
        ) {
            rawSchedules = await scheduleService.getSchedulesBetween(
                start,
                end,
                filmId
            );
        } else {
            rawSchedules = await scheduleService.getSchedules({
                film_id: filmId,
            });
        }
        if(!rawSchedules || !rawSchedules.length) return[]
        return [...new Set(rawSchedules.map((item:any) => item.date))].sort((a, b) => dayjs(a as any).valueOf() - dayjs(b as any).valueOf());
         
    }
}

export default new ScheduleListService();
