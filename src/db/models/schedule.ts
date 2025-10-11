import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import DataTypes from "../../config/config.db_type";
import Film from "../models/film";
import Cinema from "../models/cinema";
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
            get() {
                const value = this.getDataValue("id");
                return value ? BigInt(value) : null;
            },
        },
        filmID: {
            comment: "对应的电影在本平台的id",
            type: BIGINT,
            allowNull: false,
            field: "film_id",
            get() {
                const value = this.getDataValue("filmID");
                return value ? BigInt(value) : null;
            },
        },
        cinemaID: {
            type: INT,
            field: "cinema_id",
            allowNull: false,
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

Film.hasMany(Schedule, {
    foreignKey: { name: "filmID", allowNull: false },
    as:"schedule",
    onDelete: "CASCADE",
});
Schedule.belongsTo(Film, { foreignKey: { name: "filmID", allowNull: false },as:"film" });

Cinema.hasMany(Schedule, {
    foreignKey: { name: "cinemaID", allowNull: false },
    as: "schedule",
    onDelete: "CASCADE",
});
Schedule.belongsTo(Cinema, {
    foreignKey: { name: "cinemaID", allowNull: false },
    as:"cinema"
});

export default Schedule;
