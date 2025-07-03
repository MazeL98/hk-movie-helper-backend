import {Model,InferAttributes,InferCreationAttributes,CreationOptional } from "sequelize";
import {seq} from "../connection/mysql_connect"
import DataTypes from "../../config/config.db_type"

const {STRING, INT} = DataTypes

class  Theater extends Model<InferAttributes<Theater>,InferCreationAttributes<Theater>> {
  declare id: CreationOptional<number>
  declare name: string
}


Theater.init({
  id: {
    comment: 'theater id',
    type: INT,
    unique: true,
    primaryKey: true,
    autoIncrement:true
  },
  name:{
    comment: '院线名称',
    type: STRING,
    allowNull: false,
    unique: true,
  }
},{
  sequelize:seq,
  tableName: "theater",
})


export default Theater

const staticTheaters = [
  {id: 1,name: '百老汇院线'},
  {
    id:2,name:'英皇戏院'
  },
  {
    id:3,name: 'CGV',
  },
  {
    id: 4,name: 'MCL院线'
  },
  {
    id:5,name: '嘉禾院线'
  },
  {
    id: 6,name: '新宝院线'
  },
  {
    id: 7,name: '高先电影院'
  },
  {
    id:8,name: 'M+戏院'
  },
  {
    id:9,name: 'Cinema City'
  },
  {
    id:10,name:'其它'
  }
]

export const addStaticTheaters = async() =>{
  for(const theater of staticTheaters) {
    const [record,created] = await Theater.findOrCreate({
      where: {name: theater.name},
      defaults: theater
    })
     if (created) {
      console.log(`插入新院线: ${theater.name}`);
    } else {
      console.log(`跳过，数据已存在: ${theater.name}`);
    }
  }
}


