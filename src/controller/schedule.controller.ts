import scheduleListService from "../services/applicationServices/scheduleList.service";

import { type scheduleListQuery,scheduleValidDatesQuery } from "../types/schedule";

export const getScheduleList = async (queries: scheduleListQuery) => {
    let result: any;
  console.log("查询参数",JSON.stringify(queries))
    if (queries.cinemaId && queries.date) {
        console.log("查询排片类型:影院");
        result = await scheduleListService.getSchedulesByCinema(
            Number(queries.cinemaId),
            queries.date
        );
    } else if (queries.filmId && queries.date) {
        console.log("查询排片类型:电影");
 
        result = await scheduleListService.getSchedulesByFilm(
            Number(queries.filmId),
            queries.date
        );
    } else {
        result = "缺少查询条件，请重试";
    }
    return result;
};


 export const getScheduleDatesForFilm =async (queries:scheduleValidDatesQuery) =>{
  const {filmId,startDate,endDate} = queries
  const result = await scheduleListService.getScheduleDatesForFilm(Number(filmId),startDate,endDate)
  return result;
 }

 export const getScheduleDatesForCinema = async( cinemaId:string)=>{
  const result = await scheduleListService.getScheduleDatesForCinema(Number(cinemaId))
  return result;
 }
