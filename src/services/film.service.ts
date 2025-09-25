import { InferAttributes, Op } from "sequelize";

import FilmModel from "../db/models/film";

import { FILM_SOURCE } from "../const/film_source";
import { PaginatedResult } from "../types/common";

import dayjs from "dayjs";
import { normalizeBroadwayFilmName } from "../libs/format";

type FilmItem = InferAttributes<FilmModel>;

const formatDate = (dateString: string, source: number): string => {
    if (!dateString) return "";
    if (source === FILM_SOURCE.EEG) {
        const cleaned = dateString
            .replace(/[^\d]/g, "-")
            .replace(/-+/g, "-")
            .replace(/-$/, "");
        return dayjs(cleaned).format("YYYY-MM-DD") || dateString;
    }

    if (source === FILM_SOURCE.BROADWAY) {
        const dateRegex = /\b\d{2}-\d{2}-\d{4}\b/;

        const match = dateString.match(dateRegex);
        const str = match ? match[0] : null;
        if (!str) return "";
        const dateArr = str.split("-");
        const year = dateArr.pop() as string;
        const month = dateArr.pop() as string;
        dateArr.unshift(year);
        dateArr.unshift(month);
        return dateArr.join("-");
    } else {
        return dayjs(dateString).format("YYYY-MM-DD") || dateString;
    }
};

const limitStringLength = (str: string, maxLength: number): string => {
    if ([...str].length <= maxLength) return str;
    return [...str].slice(0, maxLength).join("");
};

const cleanData = (data: FilmItem): FilmItem => {

    if (data.nameHK) {
        data.nameHK = normalizeBroadwayFilmName(data.nameHK);
    }
    if (data.nameEN) {
        data.nameEN = normalizeBroadwayFilmName(data.nameEN);
    }
    if (data.onScreenDate && data.source) {
        data.onScreenDate = formatDate(data.onScreenDate, data.source);
    }
    if (data.castSimplified) {
        data.castSimplified = limitStringLength(data.castSimplified, 100);
    }

    if (data.duration) {
        data.duration = data.duration
            ?.replace(/\n/g, "")
            .trim()
            .split("分鐘")[0];
    }
    return data;
};

class FilmService {
    async addFilmData(data: FilmItem): Promise<FilmModel | null> {
        const target = await this.searchByName(data.nameHK);
        if (target) return null;

        try {
            const res = await FilmModel.create(cleanData(data));
            return res
        } catch (createError) {
            throw createError;
        }
    }

    // 更新电影数据
    async updateFilmData(data: FilmItem) {
        if (!data.nameHK) {
            console.log("updateFilmData Failed: 缺少 name_hk 字段");
            return;
        }
      
        const old = await this.searchByName(data.nameHK);

        if (old && old.id) {
            try {
                // 只更新非undefined/null的字段
                const cleanedData = cleanData(data);
                for (const [key, value] of Object.entries(cleanedData)) {
                    if (key !== 'name_hk' && value !== undefined && value !== null) {
                       old.set(key as keyof FilmItem, value);
                    }
                }
                await old.save();
            } catch (updateError) {
                console.error(
                    "Error in updateFilmData",
                    updateError
                );
                throw updateError;
            }
        }
    }
    // fuzzySearch 根据raw_name模糊搜索电影条目，返回普通对象数据（而不是模型实例数据）
    async fuzzySearchByName(raw: string){
        //格式化名字
        if (!raw) return null;
        const formatted = normalizeBroadwayFilmName(raw);
        const result = await this.getOneFilm({ name_hk: formatted });
        return result;
    }

    // 根据raw_name查询电影，返回sequelize实例
   async searchByName(rawName: string): Promise<FilmModel | null> {
        //格式化名字
        if (!rawName) return null;
        const formattedName = normalizeBroadwayFilmName(rawName);
        const res = await FilmModel.findOne({where: {
          nameHK: formattedName
        }});
        return res;
    }

    async getOneFilm(options?: any, attributes?: string[]) {
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
            const res = await FilmModel.findOne(filterOptions);
            return res ? res.toJSON() : null;
        } catch (error) {
            console.error(
                "从数据库获取单个电影时发生错误",
                error
            );
            return null;
        }
    }
    
    async getFilms(options?: any, attributes?: string[]) {
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
            const res = await FilmModel.findAll(filterOptions);
            return res.map((item) => item.toJSON()) || [];
        } catch (error) {
            console.error("查询电影时发生错误", error);
            return [];
        }
    }
    async getPaginatedFilms(
        pageNo: number,
        pageSize: number,
        searchVal?: string,
        attributes?: string[]
    ): Promise<PaginatedResult<FilmItem>> {
        const offset = (pageNo - 1) * pageSize;

        const options: any = {
            limit: pageSize,
            offset,
            order: [["id", "DESC"]],
        };
        const whereCondition: any = {};
        if (searchVal && searchVal.trim()) {
            const searchTerm = searchVal.trim();

            // 构建模糊查询条件 - 对所有指定字段进行 OR 查询
            whereCondition[Op.or] = [
                { name_hk: { [Op.like]: `%${searchTerm}%` } },
                { name_simplified: { [Op.like]: `%${searchTerm}%` } },
                { name_en: { [Op.like]: `%${searchTerm}%` } },
                { director_hk: { [Op.like]: `%${searchTerm}%` } },
                { director_simplified: { [Op.like]: `%${searchTerm}%` } },
                { director_en: { [Op.like]: `%${searchTerm}%` } },
            ];
            options.where = whereCondition;
        }

        if (attributes && attributes.length) {
            options.attributes = attributes;
        }
        console.log(options);
        try {
            const result = await FilmModel.findAndCountAll(options);

            return {
                data: result.rows.map(row => row.toJSON()),
                total: result.count,
                pageNo: pageNo,
                pageSize: pageSize,
            };
        } catch (error) {
            console.error("分页查询电影列表时发生错误", error);
            return {
                data: null,
                total: 0,
                pageNo: pageNo,
                pageSize: pageSize,
            };
        }
    }
}

export default new FilmService();
