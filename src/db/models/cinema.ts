import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import DataTypes from "../../config/config.db_type";
import { staticCinemas } from "./staticCinemas";
const { STRING, INT } = DataTypes;

class Cinema extends Model<
    InferAttributes<Cinema>,
    InferCreationAttributes<Cinema>
> {
    declare id: CreationOptional<number>;
    declare name_hk: string;
    declare name_simplified: string;
    declare name_en: string;
    declare district_id: number;
    declare district_name: string;
    declare theater_id: number;
    declare theater_name: string;
    declare address_hk: string;
    declare address_en: string;
    declare logo?: string;
}

Cinema.init(
    {
        id: {
            comment: "cinema id",
            type: INT,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        name_hk: {
            comment: "戏院名称",
            type: STRING,
            allowNull: false,
            unique: true,
        },
        name_simplified: {
            type: STRING,
        },
        name_en: {
            type: STRING,
        },
        district_id: {
            comment: "地区编号",
            type: INT,
            allowNull: true,
        },
        district_name: {
            comment: "地区名称",
            type: STRING,
            allowNull: true,
        },
        theater_id: {
            comment: "院线编号",
            type: INT,
            allowNull: true,
        },
        theater_name: {
            comment: "院线名称",
            type: STRING,
            allowNull: true,
        },
        address_hk: {
            type: STRING,
        },
        address_en: {
            type: STRING,
        },
        logo: {
            type: STRING,
            allowNull: true,
        },
    },
    {
        sequelize: seq,
        tableName: "cinema",
        defaultScope: {
            attributes: {
                exclude: ["createdAt", "updatedAt", "status"],
            },
        },
    }
);

export default Cinema;

export const addStaticCinemas = async () => {
    for (const cinema of staticCinemas) {
        const [record, created] = await Cinema.findOrCreate({
            where: { name_hk: cinema.name_hk },
            defaults: cinema,
        });
        if (created) {
            console.log(`插入新戏院: ${cinema.name_hk}`);
        } else {
            console.log(`跳过，数据已存在: ${cinema.name_hk}`);
        }
    }
};
