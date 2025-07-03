import {ENV_CONFIG} from './config.default';
export default {
  mysql: {
    base: {
      host: ENV_CONFIG.DB_HOST as string,
      dialect: 'mysql',
      pool: {
        max:5,
        min: 0,
        idle: 10000
      }
    },
    conf: [ENV_CONFIG.DB_NAME ,ENV_CONFIG.DB_USER,ENV_CONFIG.DB_PASSWORD] as string[]
  }
}