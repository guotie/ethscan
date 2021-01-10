import { Producer } from 'kafkajs'
import kafka from './broker'

// 推送数据到kafka
const producer: Producer = kafka.producer()

async function connectBrokers() {
    await producer.connect()
    console.info('kafka broker connected')
}

async function pushKafka(data: any) {
    await producer.send({
        topic: data.topic,
        messages: [{value: JSON.stringify(data)}] // todo 是否需要 stringify
    })
}

async function pushBatch(data: Array<any>) {
    let msg = []

    for (let i = 0; i < data.length; i ++) {
        let v = JSON.stringify(data[i])

        msg.push({
            topic: data[i].topic,
            messages: [{
                value: v
            }]
        })
    }
    await producer.connect()
    
    await producer.sendBatch({
        topicMessages: msg // todo 是否需要 stringify
    })
}

export {
    pushKafka,
    pushBatch,
    connectBrokers,
}
