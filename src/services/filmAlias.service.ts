import { InferAttributes } from "sequelize";
import FilmAliasModel from "../db/models/filmAlias";

type FilmAlias = InferAttributes<FilmAliasModel>;

class FilmAliasService {
    async addFilmAlias(data: FilmAlias) {
        const target = await FilmAliasModel.findOne({
            where: {
                rawName: data.rawName,
                source: data.source,
            },
        });
        if (target) {
          console.log("ADD FAILED: film_alias 表中已存在该数据")
            return;
        }
        await FilmAliasModel.create(data);
    }
    // 查询单条结果
    async getFilmAlias(options?: any,attributes?:string[]) {
        console.log("查询条件",options)
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: { ...options },
                };
            }
            if(attributes?.length) {
              filterOptions.attributes = [...attributes]
            }
            const res = await FilmAliasModel.findOne(filterOptions);
            // console.log("查询结果",res)
            return res ? res.toJSON() : null;
        } catch (error) {
            console.error(
                "从数据库获取film_alias数据时发生错误",
                JSON.stringify(error)
            );
            return null;
        }
    }
}

export default new FilmAliasService();
