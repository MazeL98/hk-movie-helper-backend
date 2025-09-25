import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import DataTypes from "../../config/config.db_type";

const { STRING, BIGINT, INT } = DataTypes;

class Film extends Model<InferAttributes<Film>, InferCreationAttributes<Film>> {
    declare id?: CreationOptional<bigint>;
    declare filmSourceID?: number;
    declare imdbID?: string;
    declare doubanID?: string;
    declare nameHK: string;
    declare nameEN?: string;
    declare nameSimplified?: string;
    declare language?: string;
    declare onScreenDate?: string;
    declare duration?: string;
    declare genres?: string;
    declare posterUrlExternal?: string;
    declare posterUrlInternal?: string;
    declare directorEN?: string;
    declare directorHK?: string;
    declare directorSimplified?: string;
    declare castEN?: string;
    declare castHK?: string;
    declare castSimplified?: string;
    declare ratingDouban?: number;
    declare ratingImdb?: number;
    declare country?: string;
    declare status?: number;
    declare source?: number;
}

Film.init(
    {
        id: {
            comment: "film id",
            type: BIGINT,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
            get() {
                const value = this.getDataValue("id");
                return value ? BigInt(value) : null;
            },
        },
        filmSourceID: {
            comment: "在源网站上的 id",
            type: INT,
            allowNull: true,
            unique: false,
            field: "film_source_id",
        },
        imdbID: {
            comment: "在IMDB上的 id",
            type: STRING,
            unique: false,
            field: "imdb_id",
        },
        doubanID: {
            comment: "在豆瓣上的 id",
            type: STRING,
            unique: false,
            field: "douban_id",
        },
        source: {
            comment: "来自哪个网站",
            type: INT,
            allowNull: true,
            unique: false,
        },
        nameHK: {
            comment: "film name in hk",
            type: STRING,
            allowNull: false,
            unique: true,
            field: "name_hk",
        },
        nameEN: {
            comment: "film name in english",
            type: STRING,
            allowNull: true,
            field: "name_en",
        },
        nameSimplified: {
            comment: "film name in simplified chinese",
            type: STRING,
            allowNull: true,
            field: "name_simplified",
        },
        language: {
            comment: "film language",
            type: STRING,
        },
        onScreenDate: {
            type: STRING,
            field: "on_screen_date",
        },
        duration: {
            type: STRING,
        },
        posterUrlExternal: {
            type: STRING,
            comment: "film poster origin url",
            field: "poster_url_external",
        },
        posterUrlInternal: {
            type: STRING,
            comment: "film poster url in qiniuyun",
            field: "poster_url_external",
        },
        directorHK: {
            type: STRING,
            field: "director_hk",
        },
        directorEN: {
            type: STRING,
            field: "director_en",
        },
        directorSimplified: {
            type: STRING,
            field: "director_en",
        },
        castHK: {
            type: STRING,
            field: "cast_hk",
        },
        castEN: {
            type: STRING,
            field: "cast_en",
        },
        castSimplified: {
            type: STRING,
            field: "cast_simplified",
        },
        genres: {
            type: STRING,
        },
        country: {
            type: STRING,
        },
        ratingDouban: {
            type: INT,
            field: "rating_douban",
        },
        ratingImdb: {
            type: INT,
            field: "rating_imdb",
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
