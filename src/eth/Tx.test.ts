require('dotenv').config()

import provider from './Provider'
import { getEthTx } from './Tx'

async function testTx() {
    // token transfer
    let ttx = await getEthTx(provider, '0x8ecfe5b96ca53f2c4316f4f3a35e9a7d149f58d785da603f24d1dd7a5bb064e6', 0)
    console.log('token transfer:', ttx)
    console.log(ttx.txLogs)

    // internal call
    let ctx = await getEthTx(provider, '0xdca039999cd960538c08bd74e0072f43b4b8d3b8b3104fd33f2b56495eb88ee6', 0)
    console.log('contract call tx:', ctx)
    console.log(ctx.txLogs)

    // 合约创建 4634748
    let ccx = await getEthTx(provider, '0x2f1c5c2b44f771e942a8506148e256f94f1a464babc938ae0690c6e34cd79190', 0)
    console.log('contract created:', ccx)

    // 失败
    let fctx = await getEthTx(provider, '0xe9e8dc8e236408ecb8d218b8d5933b66cfe1cbb5fd26333bdc40196da49fbab5', 0)
    console.log('failed tx:', fctx)
}

testTx()

setInterval(() => {}, 1000)
