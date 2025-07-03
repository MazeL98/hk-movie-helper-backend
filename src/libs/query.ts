import {Op} from 'sequelize'


export const buildFuzzyQuery   = (options:any) => {
  const where: any= {};
  for (const key in options) {
    const value = options[key];
    if (typeof value === 'string') {
      where[key] = { [Op.like]: `%${value}%` };
    } else {
      where[key] = value;
    }
  }
  return where;
}