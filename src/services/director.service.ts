import { InferAttributes } from "sequelize";
import DirectorModel from "../db/models/director";

type Director = InferAttributes<DirectorModel>;

class DirectorService {
  async addDirector(data: Director) {
    const target = await DirectorModel.findOne({
      where: {
          idImdb: data.idImdb,
      },
  });
  if(target) {
    await DirectorModel.update(data,{
      where: { idImdb:data.idImdb }
    })
  } else {
    await DirectorModel.create(data)
  }
  }
  // 查询单条结果
  async getDirector(options?: any) {
    // console.log("查询条件",options)
    try{
      let filterOptions: any = {};
      if (Object.keys(options).length) {
          filterOptions = {
              where: { ...options },
          };
      }
      const res = await DirectorModel.findOne(filterOptions);
      // console.log("查询结果",res)
      return res ? res.toJSON() : null;
    } catch(error) {
      console.error("从数据库获取导演数据时发生错误", error);
      return null;
    }
  } 
   // 查询多条结果
   async getDirectors (options?: any) {
    try{
      let filterOptions: any = {};
      if (Object.keys(options).length) {
          filterOptions = {
              where: { ...options },
          };
      }
      const res = await DirectorModel.findAll(filterOptions);
      return res.map((item) => item.toJSON()) || [];
    } catch(error) {
      console.error("从数据库获取导演数据时发生错误", error);
      return [];
    }
  } 
}

export default new DirectorService();