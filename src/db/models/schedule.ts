import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import DataTypes from "../../config/config.db_type";

const { STRING, BIGINT, INT, DATE } = DataTypes;

class Schedule extends Model<
    InferAttributes<Schedule>,
    InferCreationAttributes<Schedule>
> {
    declare id?: CreationOptional<bigint>;

    declare filmID: bigint;
    declare cinemaID?: number;
    declare cinemaName: string;
    declare date: string;
    declare time: string;
    declare house?: string;
    declare attr?: string;
}

Schedule.init(
    {
        id: {
            comment: "schedule id",
            type: BIGINT,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        filmID: {
            comment: "对应的电影在本平台的id",
            type: BIGINT,
            allowNull: true,
            field: "film_id",
        },
        cinemaID: {
            type: INT,
            field: "cinema_id",
        },
        cinemaName: {
            type: STRING,
            field: "cinema_name",
        },
        date: {
            type: STRING,
        },
        time: {
            type: STRING,
        },
        house: {
            type: STRING,
        },
        attr: {
            type: STRING,
        },
    },
    {
        sequelize: seq,
        tableName: "schedule",
        defaultScope: {
            attributes: {
                exclude: ["createdAt", "updatedAt", "status"],
            },
        },
    }
);

export default Schedule;
