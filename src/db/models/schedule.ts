import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import DataTypes from "../../config/config.db_type";

const { STRING, INT, DATE } = DataTypes;

class Schedule extends Model<
    InferAttributes<Schedule>,
    InferCreationAttributes<Schedule>
> {
    declare id?: CreationOptional<number>;

    declare film_id: number;
    declare cinema_id?: number;
    declare cinema_name: string;
    declare date: string;
    declare time: string;
    declare house?: string;
    declare attr?: string;
}

Schedule.init(
    {
        id: {
            comment: "schedule id",
            type: INT,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        film_id:{
          comment: "对应的电影在本平台的id",
          type: INT,
          allowNull:true
        },
        cinema_id: {
            type: INT,
        },
        cinema_name: {
            type: STRING,
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
