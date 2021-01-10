import { assert } from 'console'
import { Kafka } from 'kafkajs'

// 
require('dotenv').config()

assert(!!process.env.KAFKA_BROKERS, 'not found KAFKA_BROKERS in .env')

const kafka = new Kafka({
    clientId: 'syncer',
    brokers: process.env.KAFKA_BROKERS?.split(',') ?? []
})

export default kafka
