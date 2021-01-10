import BigNumber from 'bignumber.js'

require('dotenv').config()

import provider from './Provider'
import { getTokenInfo, getBalance, getCachedLatestBlockNumber, batchGetInfo } from './Updater'
import { sleep } from './utils'


async function testBalace() {
    // usdt
    let usdc = await getTokenInfo('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
    let usdt = await getTokenInfo('0xdac17f958d2ee523a2206206994597c13d831ec7')
    console.log('usdc:', usdc)
    console.log('usdt:', usdt)

    let address: string[] = ['0x4DEBbd1B723E6b71C4410FFc71465Ba3C09C5F33', '0x338d60b61b638c5e0cec787c3bbf504a8657a054', '0xA910f92ACdAf488fa6eF02174fb86208Ad7722ba']
    let tokens: string[] = ['', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', '0xdac17f958d2ee523a2206206994597c13d831ec7']
    address.forEach(addr => {
        tokens.forEach(async token => {
            let balance = await getBalance(addr, token, 100)
            console.log('address %s token %s balance: %s', addr, token, balance?.toString())
        })
    })
    await sleep(3000)
    // cached balance
    address.forEach(addr => {
        tokens.forEach(async token => {
            let balance = await getBalance(addr, token, 100)
            console.log('cached address %s token %s balance: %s', addr, token, balance?.toString())
        })
    })
}

async function testCacheHeight() {
    let height = getCachedLatestBlockNumber()
    let i = 0
    console.info('height:', i, height)
    
    setInterval(() => {
        height = getCachedLatestBlockNumber()
        i ++
        console.log('height:', i, height)
    }, 20000)
}

// revert:

// action:'token-transfer'
// address:'0xbfa8307ffaadea639d49ffdc50188eeebcdefdd8'
// height:6000001
// token:'0xB9A824e6dC289c57fAc91c16C77E37666cCE20e5'
// topic:'eth-account'
// txHash:'0x8d7a206b3650092288ff099cda2c35e66aece9fb1cd9617e723f3b53849787ba'

// action:'token-transfer'
// address:'0x45969056002faf220e505bcd39fee1d1a7c8ab15'
// height:6000001
// token:'0xF5b0A3eFB8e8E4c201e2A935F110eAaF3FFEcb8d'
// topic:'eth-account'
// txHash:'0x03a717362da048252a16189736243e58b41361cba0e1a3d6b83e28f03362a8c5'

async function testRevert() {
    let ts = [
        {
            action: 'token-transfer',
            address: '0xbfa8307ffaadea639d49ffdc50188eeebcdefdd8',
            height: 6000001,
            token: '0xB9A824e6dC289c57fAc91c16C77E37666cCE20e5',
            topic: 'eth-account',
            txHash: '0x8d7a206b3650092288ff099cda2c35e66aece9fb1cd9617e723f3b53849787ba'
        },
        {
            action: 'token-transfer',
            address: '0x45969056002faf220e505bcd39fee1d1a7c8ab15',
            height: 6000001,
            token: '0xF5b0A3eFB8e8E4c201e2A935F110eAaF3FFEcb8d',
            topic: 'eth-account',
            txHash: '0x03a717362da048252a16189736243e58b41361cba0e1a3d6b83e28f03362a8c5'
        }
    ]

    // ts.forEach(async t => {
    //     let bal = await getBalance(t.address, t.token, t.height)
    //     console.log('tx: %s address: %s token: %s balance: %s', t.txHash, t.address, t.token, bal)
    // })
    // ts.forEach(async t => {
    //     await batchGetInfo(provider, t.token)
    // })
    batchGetInfo(provider, '0xdac17f958d2ee523a2206206994597c13d831ec7')
}

;(async () => {
    // getTokenInfo('')
    testRevert()
    return
    testCacheHeight()
    testBalace()
})()
