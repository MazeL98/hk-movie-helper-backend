/**
 * Redis连接
 */

import redis from 'redis';

import  {ENV_CONFIG} from '../config/config.default'


// redis[s]://[[username][:password]@][host][:port][/db-number]:
const redisServer = redis.createClient({
  url : `redis://${ENV_CONFIG.REDIS_USER}:${ENV_CONFIG.REDIS_PASSWORD}@${ENV_CONFIG.REDIS_HOST}:${ENV_CONFIG.REDIS_PORT}`
})

redisServer.on('error', function (err:any) {
  console.log("Redis连接出错了",err.code); 
})

export default redisServer