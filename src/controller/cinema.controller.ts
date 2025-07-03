
import cinemaService from "../services/cinema.service";
import { CinemaItem } from "../types/cinema";
export const getCinemaList = async (
    pageNo: number,
    pageSize: number,
    districtId?: number,
    theaterId?: number
) => {

    if (!pageNo || !pageSize)
        return console.log(
            "Error in GetCinemaList: pageNo or pageSize is undefined"
        );
    let result: any;
    let queries:Partial<CinemaItem> = {};
     if(districtId) {
      queries.district_id = districtId
     }
     if(theaterId) {
      queries.theater_id = theaterId
     }
    result = await cinemaService.getPaginatedCinemas(pageNo,pageSize,[],queries)
    return result;
};
