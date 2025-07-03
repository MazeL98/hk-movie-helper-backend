import { InferAttributes } from "sequelize";
import { PaginatedResult } from "../types/common";
import CinemaModel from "../db/models/cinema";
import { buildFuzzyQuery } from "../libs/query";
type Cinema = InferAttributes<CinemaModel>;
type PartialCinema = Partial<Cinema>;
class CinemaService {
    // 查询单条结果
    async getCinema(options?: any, attributes?: string[]) {
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: { ...options },
                };
            }
            if (attributes?.length) {
                filterOptions.attributes = [...attributes];
            }
            const res = await CinemaModel.findOne(filterOptions);
            // console.log("查询结果",res)
            return res ? res.toJSON() : null;
        } catch (error) {
            console.error(
                "从数据库获取戏院数据时发生错误",
                JSON.stringify(error)
            );
            return null;
        }
    }
    // 模糊查询单条结果
    async getCinemaByFuzzyQuery(options?: any, attributes?: string[]) {
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: buildFuzzyQuery(options),
                };
            }
            if (attributes?.length) {
                filterOptions.attributes = [...attributes];
            }
            const res = await CinemaModel.findOne(filterOptions);
            // console.log("查询结果",res)
            return res ? res.toJSON() : null;
        } catch (error) {
            console.error(
                "从数据库获取戏院数据时发生错误",
                JSON.stringify(error)
            );
            return null;
        }
    }
    // 查询多条结果
    async getCinemas(options?: any, attributes?: string[]) {
        try {
            let filterOptions: any = {};
            if (Object.keys(options).length) {
                filterOptions = {
                    where: { ...options },
                };
            }
            if (attributes && attributes.length) {
                filterOptions.attributes = attributes;
            }
            const res = await CinemaModel.findAll(filterOptions);
            return res.map((item) => item.toJSON()) || [];
        } catch (error) {
            console.error(
                "从数据库获取戏院数据时发生错误",
                JSON.stringify(error)
            );
            return [];
        }
    }

    async getPaginatedCinemas(
        pageNo: number,
        pageSize: number,
        attributes?: string[],
        queries?: PartialCinema
    ): Promise<PaginatedResult<Cinema>> {
        const offset = (pageNo - 1) * pageSize;
        const options: any = {
            limit: pageSize,
            offset,
            order: [["id", "DESC"]],
        };
        if (attributes && attributes.length) {
            options.attributes = attributes;
        }
        if (queries) {
            options.where = queries;
        }
        try {
            const result = await CinemaModel.findAndCountAll(options);

            return {
                data: result.rows,
                total: result.count,
                pageNo: pageNo,
                pageSize: pageSize,
            };
        } catch (error) {
            console.error("分页查询戏院时发生错误", JSON.stringify(error));
            return {
                data: null,
                total: 0,
                pageNo: pageNo,
                pageSize: pageSize,
            };
        }
    }
}

export default new CinemaService();
