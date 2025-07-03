
import theaterService from "../services/theater.service";

export const getTheaterList = async (
) => {
  const result= await theaterService.getTheaters()
  return result
}