import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import DataTypes from "../../config/config.db_type";

const { STRING, INT } = DataTypes;

class Director extends Model<
    InferAttributes<Director>,
    InferCreationAttributes<Director>
> {
    declare id?: CreationOptional<number>;
    declare idImdb?: string;
    declare nameHK?: string;
    declare nameEN?: string;
    declare nameSimplified?: string;
    declare status?: number;
}

Director.init(
    {
        id: {
            comment: "director id",
            type: INT,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        idImdb: {
            comment: "在IMDB上的 id",
            type: STRING,
            allowNull: true,
            unique: true,
            field: "id_imdb",
        },
        nameHK: {
            comment: "导演名字港译",
            type: STRING,
            allowNull: true,
            field: "name_hk",
        },
        nameEN: {
            comment: "导演名字英文",
            type: STRING,
            allowNull: true,
            field: "name_en",
        },
        nameSimplified: {
            comment: "导演名字简体中文",
            type: STRING,
            allowNull: true,
            field: "name_simplified",
        },
        status: {
            type: INT,
            comment: "1-true, 0-false",
        },
    },
    {
        sequelize: seq,
        tableName: "director",
        defaultScope: {
            attributes: {
                exclude: ["createdAt", "updatedAt", "status"],
            },
        },
    }
);

export default Director;
