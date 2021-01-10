import kafka from '../kafka/broker'
import { TopicEthAccount, TopicErcToken } from './Push'
import { upsertAddressBalance, updateTokenInfo } from './Updater'

import { KafkaMessage, EachMessagePayload, EachBatchPayload } from 'kafkajs'

// 从kafka中读取消息, 更新用户余额

const consumer = kafka.consumer({ groupId: 'syncer' })
const Zero_Address = '0x0000000000000000000000000000000000000000'

async function subscribeTopics(topics: string[], fromBeginning = true) {
  for (let i = 0; i < topics.length; i ++) {
    await consumer.subscribe({ topic: topics[i], fromBeginning: fromBeginning })
  }
}

async function handleMessage({topic, partition, message}: EachMessagePayload) {
  let val = JSON.parse(message.value?.toString() ?? '{}')
  // console.log(topic, val)
  if (val.address === '0x') {
    console.warn('invalid address:', val, JSON.stringify(val))
    //process.exit(-1)
  }
  if (val.address === Zero_Address) {
    return
  }
  // return
  try {
    switch (topic) {
      case TopicEthAccount:
        await upsertAddressBalance(val.address, val.token, val.height ?? 11550000)
        break

      case TopicErcToken:
        await updateTokenInfo(val.address)
        break

      default:
        // should never reach!!!
        console.warn('unknown topic:', topic)
    }
  } catch (err) {
    console.warn('handle msg %s failed: ', val, err)
  }
}

async function handleMessageBatch(payload: EachBatchPayload) {
  console.log('msgs:', payload.batch.messages.length)
}

async function main() {
  await consumer.connect()
  await subscribeTopics([TopicEthAccount, TopicErcToken])

  consumer.run({
    // eachBatch: handleMessageBatch,
    eachMessage: handleMessage,
  })
}

// await consumer.run({
//   eachMessage: async ({ topic, partition, message }) => {
//     console.log({
//       value: message.value.toString(),
//     })
//   },
// })
main()
