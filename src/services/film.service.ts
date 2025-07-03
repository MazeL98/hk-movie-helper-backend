import { InferAttributes, Op } from "sequelize";
import FilmModel from "../db/models/film";
import { FILM_SOURCE } from "../const/film_source";
import { PaginatedResult } from "../types/common";
type FilmItem = InferAttributes<FilmModel>;
import dayjs from "dayjs";
import { normalizeBroadwayFilmName } from "../libs/format";
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
    if (data.name_hk) {
        data.name_hk = normalizeBroadwayFilmName(data.name_hk);
    }
    if (data.name_en) {
        data.name_en = normalizeBroadwayFilmName(data.name_en);
    }
    if (data.on_screen_date && data.source) {
        data.on_screen_date = formatDate(data.on_screen_date, data.source);
    }
    if (data.cast_simplified) {
        data.cast_simplified = limitStringLength(data.cast_simplified, 100);
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
    async addFilmData(data: FilmItem) {
        // 添加数据成功后返回电影id
        let result: number | null = null;
        const cleanedData = cleanData(data);

        const target = await FilmModel.findOne({
            where: {
                name_hk: cleanedData.name_hk,
            },
        });

        if (target) {
            try {
                // 只更新非undefined/null的字段
                for (const [key, value] of Object.entries(cleanedData)) {
                    if (value !== undefined && value !== null) {
                        target.set(key as keyof FilmItem, value);
                    }
                }
                await target.save();
            } catch (updateError) {
                console.error(
                    "更新数据时发生错误",
                    JSON.stringify(updateError)
                );
                throw updateError;
            }
            result = target.id as number;
            return result;
        } else {
            // console.log( `添加新数据，来源${data.film_source_id} ${data.film_source_id}`)
            try {
                const res = await FilmModel.create(cleanedData);
                result = res.id as number;
                return result;
            } catch (createError) {
                console.error(
                    "添加数据时发生错误",
                    JSON.stringify(createError)
                );
                throw createError;
            }
        }
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
            console.error("查询单个电影时发生错误", JSON.stringify(error));
            return null;
        }
    }
    async getFilmData(options?: any, attributes?: string[]) {
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
            console.error("查询电影时发生错误", JSON.stringify(error));
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
        console.log(JSON.stringify(options));
        try {
            const result = await FilmModel.findAndCountAll(options);

            return {
                data: result.rows,
                total: result.count,
                pageNo: pageNo,
                pageSize: pageSize,
            };
        } catch (error) {
            console.error("分页查询电影列表时发生错误", JSON.stringify(error));
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
