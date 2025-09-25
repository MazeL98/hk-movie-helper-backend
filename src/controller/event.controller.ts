import eventService,{Event} from "../services/event.service"
import scheduleService from "../services/schedule.service"
import {type eventListQuery} from "../types/event"

export const getUserEvents = async (queries:eventListQuery) =>{
  const {userID,startDate,endDate} = queries
  const res = await eventService.getUserEventWithTime(userID,startDate,endDate)

  return res;
}

export const addUserEvent = async(data:Event) =>{
  console.log("controller:尝试添加日程",data)
   const res = await eventService.addEvent(data);
   return res;
}

export const deleteUserEvent = async(eventID:bigint) =>{
  const res = await eventService.deleteEvent(eventID);
   return res;
}