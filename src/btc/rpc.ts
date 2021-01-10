
// async function getBlock(params:type) {
    
// }

// async function getTx(params:type) {
    
// }

// @ts-ignore
import RpcClient from 'bitcoind-rpc'
import { resolve } from 'path';

// curl  -d '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockcount", "params": [] }' 
// http://rosetta:rosetta@proxy.ankr.com:8332
const client = new RpcClient({
    protocol: 'http',
    user: 'rosetta',
    pass: 'rosetta',
    host: 'proxy.ankr.com',
    port: '8332',
  })

const fns: Array<string> = ['getBlockHash', 'getBlock', 'getBlockHeader', 'getBlockHeader', 'getMemoryPool', ]
for (let i = 0; i < fns.length; i ++) {
    let fn = fns[i]
    client[fn + 'Async'] = async (args: [any]) => {
        return new Promise((resolve, reject) => {
            client[fn](...args, function(err: any, resp: any) {
                if (err) {
                    console.warn(fn, args, err)
                    resolve(err)
                    return
                }
                resolve(resp)
            })
        })
    }
}

client.getBlockByHeight = async (height: number) => {
    let resp1 = await client.getBlockHashAsync([height])
    if (resp1.code === -1) {
        return resp1
    }
    let hash = resp1.result
    // console.log(hash)
    let resp2 = await client.getBlockAsync([hash, 1])

    console.log(resp2)
    return resp2
    // @ts-ignore
    // client.getBlock(hash, 1, (err, resp) => {
    //     console.log('block:', err, resp)
    // })
}

;(async () => {
    let hash = await client.getBlockByHeight(1)
    console.log(hash)
})();

export default client
