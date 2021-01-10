import Redis from 'ioredis'

require('dotenv').config()
//
// Connect to 127.0.0.1:6380, db 4, using password "authpassword":
// new Redis("redis://:authpassword@127.0.0.1:6380/4");
const redis = new Redis(process.env.REDIS_OPT ?? 'redis://127.0.0.1:6379')

export default redis
