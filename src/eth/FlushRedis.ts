import redis from '../redis/client'

(async () => {
    await redis.flushdb()
    console.info('flush redis db success')
})()

