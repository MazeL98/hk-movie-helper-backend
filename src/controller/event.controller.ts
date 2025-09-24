import eventService,{Event} from "../services/event.service"
import {type eventListQuery} from "../types/event"

export const getEventByUser = async (queries:eventListQuery) =>{
  const {userId,startDate,endDate} = queries
  const res = await eventService.getEventByUserBetween(userId,startDate,endDate)
  return res;
}

export const addEvent = async(data:Event) =>{
   const res = await eventService.addEvent(data);
   return res;
}