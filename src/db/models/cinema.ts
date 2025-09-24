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
    declare nameHK: string;
    declare nameSimplified: string;
    declare nameEN: string;
    declare districtID: number;
    declare districtName: string;
    declare theaterID: number;
    declare theaterName: string;
    declare addressHK: string;
    declare addressEN: string;
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
        nameHK: {
            comment: "戏院名称",
            type: STRING,
            allowNull: false,
            unique: true,
            field: "name_hk",
        },
        nameSimplified: {
            type: STRING,
            field: "name_simplified",
        },
        nameEN: {
            type: STRING,
            field: "name_en",
        },
        districtID: {
            comment: "地区编号",
            type: INT,
            allowNull: true,
            field: "district_id",
        },
        districtName: {
            comment: "地区名称",
            type: STRING,
            allowNull: true,
            field: "district_name",
        },
        theaterID: {
            comment: "院线编号",
            type: INT,
            allowNull: true,
            field: "theater_id",
        },
        theaterName: {
            comment: "院线名称",
            type: STRING,
            allowNull: true,
            field: "theater_name",
        },
        addressHK: {
            type: STRING,
            field: "address_hk",
        },
        addressEN: {
            type: STRING,
            field: "address_en",
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
            where: { nameHK: cinema.nameHK },
            defaults: cinema,
        });
        if (created) {
            console.log(`插入新戏院: ${cinema.nameHK}`);
        } else {
            console.log(`跳过，数据已存在: ${cinema.nameHK}`);
        }
    }
};
