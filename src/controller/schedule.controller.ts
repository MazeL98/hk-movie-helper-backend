import scheduleListService from "../services/applicationServices/scheduleList.service";
import { isValidDateFormat } from "../libs/format";

interface ScheduleListQueries {
    filmId?: number | string;
    cinemaId?: number | string;
    date?: string;
  }

export const getScheduleList = async (queries: ScheduleListQueries) => {
    let result: any;
  console.log("查询参数",JSON.stringify(queries))
    if (queries.cinemaId && queries.date) {
        console.log("查询排片类型:影院");
        if (typeof queries.cinemaId !== "number") {
            queries.cinemaId = Number(queries.cinemaId);
        }
        result = await scheduleListService.getSchedulesByCinema(
            queries.cinemaId,
            queries.date
        );
    } else if (queries.filmId && queries.date) {
        console.log("查询排片类型:电影");
        if (typeof queries.filmId !== "number") {
            queries.filmId = Number(queries.filmId);
        }
        result = await scheduleListService.getSchedulesByFilm(
            queries.filmId,
            queries.date
        );
    } else {
        result = "缺少查询条件，请重试";
    }
    return result;
};

interface ValidDatesForFilmQueries {
  filmId:number;
  startDate?: string;
  endDate?:string;
}


 export const getScheduleDatesForFilm =async (queries:ValidDatesForFilmQueries) =>{
  const {filmId,startDate,endDate} = queries
    if(!filmId || (startDate && !isValidDateFormat(startDate)) || (endDate && !isValidDateFormat(endDate))) return null;
  const result = await scheduleListService.getScheduleDatesForFilm(filmId,startDate,endDate)
  return result;
 }


 interface ValidDatesForCinemaQueries {
  cinemaId:number;
}
 export const getScheduleDatesForCinema = async( cinemaId:number)=>{
    if(!cinemaId ) return null;
  const result = await scheduleListService.getScheduleDatesForCinema(cinemaId)
  return result;
 }
