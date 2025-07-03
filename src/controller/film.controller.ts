import filmService from "../services/film.service";
import scheduleListService from "../services/applicationServices/scheduleList.service";
export const getFilmList = async (pageNo: number, pageSize: number,searchVal?:string) => {
    if (!pageNo || !pageSize)
        return console.log(
            "Error in GetFilmList: pageNo or pageSize or queryType is undefined"
        );
    let result = await filmService.getPaginatedFilms(pageNo, pageSize, searchVal,[
        "id",
        "name_hk",
        "name_simplified",
        "name_en",
        "director_hk",
        "director_simplified",
        "director_en",
        "rating_douban",
        "poster_url_internal",
    ]);

    return result;
};

// 返回排片时间符合日期范围的所有电影
export const getFilmsByScheduleDateRange = async (
    startDate: string,
    endDate: string
) => {
    if (!startDate || !endDate) {
        console.log("缺少查询参数startDate或endDate");
        return;
    }
    let result = await scheduleListService.getSchedulesByDateRange([
        startDate,
        endDate,
    ]);
    return result;
};


