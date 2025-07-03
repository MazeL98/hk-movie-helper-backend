
import TheaterModel from "../db/models/theater";

// type Theater = InferAttributes<TheaterModel>;

class TheaterService {

  // 查询单条结果
  async getTheater(options?: any) {
    // console.log("查询条件",options)
    try{
      let filterOptions: any = {};
      if (Object.keys(options).length) {
          filterOptions = {
              where: { ...options },
          };
      }
      const res = await TheaterModel.findOne(filterOptions);
      // console.log("查询结果",res)
      return res ? res.toJSON() : null;
    } catch(error) {
      console.error("从数据库获取院线数据时发生错误", JSON.stringify(error));
      return null;
    }
  } 
   // 查询多条结果
   async getTheaters (options?: any) {
    try{
      let filterOptions: any;
      if (options && Object.keys(options).length) {
          filterOptions = {
              where: { ...options },
          };
      }
      const res = await TheaterModel.findAll(filterOptions);
      return res.map((item) => item.toJSON()) || [];
    } catch(error) {
      console.error("从数据库获取院线数据时发生错误", JSON.stringify(error));
      return [];
    }
  } 
}

export default new TheaterService();