import eventService, { Event } from "../services/event.service";
import scheduleService from "../services/schedule.service";
import { type eventListQuery } from "../types/event";

export const getUserEvents = async (queries: eventListQuery) => {
    console.log("调用controller,", queries);
    const { userID, startDate, endDate } = queries;
    const res = await eventService.getUserEventWithTime(
        userID,
        startDate,
        endDate
    );
    console.log("结果",res)
    if (res && res.length) {
        return res.map((item) => ({
            id: item.id,
            scheduleID: item.scheduleID,
            userID: item.userID,
            date: item.schedule.date,
            time: item.schedule.time,
            house: item.schedule.house,
            attr: item.schedule.attr,
            cinemaName: item.schedule.cinemaName,
            filmID: item.schedule.film.id,
            filmNameHK: item.schedule.film.nameHK,
            filmNameEN: item.schedule.film.nameEN,
            filmNameSimplified: item.schedule.film.nameSimplified,
            duration: item.schedule.film.duration,
        }));
    } else {
        return [];
    }
};

export const addUserEvent = async (data: Event) => {
    console.log("controller:尝试添加日程", data);
    const res = await eventService.addEvent(data);
    return res;
};

export const deleteUserEvent = async (eventID: bigint) => {
    const res = await eventService.deleteEvent(eventID);
    return res;
};
