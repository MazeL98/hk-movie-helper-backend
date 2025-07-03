import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import DataTypes from "../../config/config.db_type";

const { STRING, INT } = DataTypes;

class Film extends Model<InferAttributes<Film>, InferCreationAttributes<Film>> {
    declare id?: CreationOptional<number>;
    declare film_source_id?: number;
    declare imdb_id?: string;
    declare douban_id?: string;
    declare name_hk: string;
    declare name_en?: string;
    declare name_simplified?: string;
    declare language?: string;
    declare on_screen_date?: string;
    declare duration?: string;
    declare genres?: string;
    declare poster_url_external?: string;
    declare poster_url_internal?: string;
    declare director_en?: string;
    declare director_hk?: string;
    declare director_simplified?: string;
    declare cast_en?: string;
    declare cast_hk?: string;
    declare cast_simplified?: string;
    declare rating_douban?: number;
    declare rating_imdb?: number;
    declare country?: string;
    declare status?: number;
    declare source?: number;
}

Film.init(
    {
        id: {
            comment: "film id",
            type: INT,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        film_source_id: {
            comment: "在源网站上的 id",
            type: INT,
            allowNull: true,
            unique: false,
        },
        imdb_id: {
            comment: "在IMDB上的 id",
            type: STRING,
            unique: false,
        },
        douban_id: {
            comment: "在豆瓣上的 id",
            type: STRING,
            unique: false,
        },
        source: {
            comment: "来自哪个网站",
            type: INT,
            allowNull: true,
            unique: false,
        },
        name_hk: {
            comment: "film name in hk",
            type: STRING,
            allowNull: false,
            unique:true
        },
        name_en: {
            comment: "film name in english",
            type: STRING,
            allowNull: true,
        },
        name_simplified: {
            comment: "film name in simplified chinese",
            type: STRING,
            allowNull: true,
        },
        language: {
            comment: "film language",
            type: STRING,
        },
        on_screen_date: {
            type: STRING,
        },
        duration: {
            type: STRING,
        },
        poster_url_external: {
            type: STRING,
            comment: "film poster origin url",
        },
        poster_url_internal: {
            type: STRING,
            comment: "film poster url in qiniuyun",
        },
        director_hk: {
            type: STRING,
        },
        director_en: {
            type: STRING,
        },
        director_simplified: {
            type: STRING,
        },
        cast_hk: {
            type: STRING,
        },
        cast_en: {
            type: STRING,
        },
        cast_simplified: {
            type: STRING,
        },
        genres: {
            type: STRING,
        },
        country: {
            type: STRING,
        },
        rating_douban: {
            type: INT,
        },
        rating_imdb: {
            type: INT,
        },
        status: {
            type: INT,
            comment: "1-true, 0-false",
        },
    },
    {
        sequelize: seq,
        tableName: "film",
                defaultScope: {
            attributes: {
                exclude: ["createdAt", "updatedAt", "status"],
            },
        },
    }
);

export default Film;
