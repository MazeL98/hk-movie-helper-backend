import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import DataTypes from "../../config/config.db_type";

const { STRING, INT } = DataTypes;

class FilmAlias extends Model<
    InferAttributes<FilmAlias>,
    InferCreationAttributes<FilmAlias>
> {
    declare id?: CreationOptional<number>;
    declare standard_id?: number;
    declare raw_name?: string;
    declare status?: number;
    declare source?: number;
}

FilmAlias.init(
    {
        id: {
            comment: "film id",
            type: INT,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        standard_id: {
            comment: "在标准表film中的id",
            type: INT,
            allowNull: false,
            unique: false,
        },
        raw_name: {
            comment: "在源网站上的名称",
            type: STRING,
            unique: "raw_source_unique", //// 给组合约束取个名字
        },

        source: {
            comment: "来自哪个网站",
            type: INT,
            allowNull: true,
            unique: "raw_source_unique", // 和 raw_name 共享唯一约束
        },
        status: {
            type: INT,
            comment: "1-true, 0-false",
        },
    },
    {
        sequelize: seq,
        tableName: "film_alias",
        defaultScope: {
            attributes: {
                exclude: ["createdAt", "updatedAt", "status"],
            },
        },
    }
);

export default FilmAlias;
