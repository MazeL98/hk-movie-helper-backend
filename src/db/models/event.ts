import {
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { seq } from "../connection/mysql_connect";
import User from "./user";
import Schedule from "./schedule";

import DataTypes from "../../config/config.db_type";

const { STRING, BIGINT, DATE } = DataTypes;

class Event extends Model<
    InferAttributes<Event>,
    InferCreationAttributes<Event>
> {
    declare id?: CreationOptional<number>;
    declare userID: bigint;
    declare scheduleID: number;
    declare note?: string;
}

Event.init(
    {
        id: {
            comment: "Event 条目 id",
            type: BIGINT,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        userID:{
          type:BIGINT,
          comment: "用户ID",
          allowNull:false,
          field:"user_id"
        },
        scheduleID:{
          type:BIGINT,
          comment: "排片表ID",
          allowNull:false,
          field:"schedule_id"
        },
        note:{
          type:STRING,
          comment: "日程备注",
          allowNull:true
        }

    },
    {
        sequelize: seq,
        tableName: "event",
                defaultScope: {
            attributes: {
                exclude: ["createdAt", "updatedAt", "status"],
            },
        },
    }
);


// 将日程表和用户表、排片表关联起来
// 告诉父母表要一对多
// 告诉子表从属于哪个父母表
User.hasMany(Event,{
  foreignKey: {name: 'user_id',allowNull:false},
  onDelete:'CASCADE'
})
Event.belongsTo(User,{foreignKey:{ name: 'schedule_id', allowNull: false }})

Schedule.hasMany(Event, {
  foreignKey: { name: 'schedule_id', allowNull: false },
  onDelete: 'CASCADE',   // 删除排片时级联删除
});
Event.belongsTo(Schedule, { foreignKey:{ name: 'schedule_id', allowNull: false } });


export default Event;