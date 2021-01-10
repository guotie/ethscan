import LRU from 'lru-cache'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'

import provider from './Provider'
import { getLatestBlockNumber } from './Block'
import EthContract, { ContractTypeERC20 } from './Contract'
// import { sleep } from './utils'
import Account from './Account'
import { bnToString, e1_18, toBn } from './utils'

// import Contract from 'web3-eth-contract'

// 如果用 import Erc20ABI from './abi/erc20.abi.json', 会有warning: https://github.com/ethereum/web3.js/issues/3310
const Erc20ABI = require('./abi/erc20.abi.json')
// 接收kafka消息，更新用户余额

// @ts-ignore web3 版本的问题, 可能会在1.4.0解决 https://github.com/ethereum/web3.js/issues/3734
// Contract.setProvider(provider)
// console.log(Erc20ABI)
// @ts-ignore
// const erc20Contract = new provider.eth.Contract(Erc20ABI)

// 已经更新了的 token 或者数据库中已经更新了的token

interface CacheBalance {
    balance: BigNumber
    height: number
    db: boolean
}

// 已经更新了的地址余额 {balance: , height: }
const balanceCache: LRU<string, CacheBalance> = new LRU(10000000)

interface CacheTokenInfo {
    address: string
    status:  'querying' | 'queryed'
    name: string
    symbol: string
    decimals: number
    maxSupply: BigNumber
    contractType?: string
}

const tokenInfoCache: LRU<string, CacheTokenInfo> = new LRU(10000000)

// token ABI

function keyBalance(address: string, token: string) {
    return address + "-" + token
}

let latestHeight = 11560000  // 
setInterval(async () => {
    try {
        let latest = await getLatestBlockNumber(provider)
        latestHeight = latest
    } catch {}
}, 15000)

// 缓存 latest block number
function getCachedLatestBlockNumber() {
    return latestHeight
}

// 防止并发
const reentryUpSertAccount: { [index: string]: number } = {}
const reentryTokenInfo: { [index: string]: number } = {}

// 插入或更新用户资产
async function upsertAddressBalance(address: string, token = '', height: number) {
    let key = keyBalance(address, token)
    if (reentryUpSertAccount[key]) {
        return
    }
    reentryUpSertAccount[address] = height

    let bal = await getBalance(address, token, height)
    if (bal.db) {
        console.log('--------------------------------------got form cache')
        return
    }
    await Account.upsertAccountBalance(address, token, bal.balance, getCachedLatestBlockNumber())
    console.info('upsert address %s token %s balance: %s', address, token !== '' ? token : 'ETH', bal.balance.toString())

    bal.db = true
    balanceCache.set(key, bal)
    delete reentryUpSertAccount[key]
    return bal.balance
}

// token为空时 获取地址的eth余额, 否则查询 token 的余额
async function getBalance(address: string, token = '', height: number): Promise<CacheBalance> {
    if (token === '' || token === 'ETH' || token === 'Eth') {
        token = ''
    }
    let key = keyBalance(address, token)

    let bal: CacheBalance | undefined = balanceCache.get(key)
    if (bal && bal.height > height) {
        return bal
    }

    // if (token === '') {
    //     let ethBal = await provider.eth.getBalance(address)
    // }

    let latest = getCachedLatestBlockNumber()
    if (!token) {
        let bal = await provider.eth.getBalance(address)
        let bnBal = new BigNumber(bal).div(e1_18)
        balanceCache.set(key, { balance: bnBal, height: latest, db: false })
        return { balance: bnBal, height, db: false }
    }

    // token abi
    return await getTokenBlance(address, token, height)
}

// 获取地址的token balance
async function getTokenBlance(address: string, token: string, height: number, loadCache = false): Promise<CacheBalance> {
    let key = keyBalance(address, token)
    let bal: CacheBalance | undefined

    if (loadCache) {
        bal = balanceCache.get(key)
        if (bal && bal.height > height) {
            return bal
        }
    }

    // 1. 是否缓存了token abi
    let tokenCont = getTokenContractInst(token)
    // 2. 创建token contract
    // 3. 调用contract 方法获取余额
    let balance = await tokenCont.methods.balanceOf(address).call()
    console.log('token %s balance: %s', token, balance)
    // 4. todo 还需更新token的total supply, 因为mint burn也会发出transfer事件
    let ti = await getTokenInfo(token)
    let totalSupply = await tokenCont.methods.totalSupply().call()

    await updateTokenTotalSupply(ti, totalSupply)
    let bnBal = toBn(balance, ti.decimals)
    return { balance: bnBal, height, db: false }
}

function getTokenContractInst(address: string) {
    // console.log(Contract)
    // todo 缓存
    // @ts-ignore
    return new provider.eth.Contract(Erc20ABI, address)
}

// 是否需要更新 token info 的 maxSupply
async function updateTokenTotalSupply(ti: CacheTokenInfo, totalSupply: string) {
    let maxSupply = new BigNumber(totalSupply)
    if (maxSupply.comparedTo(ti.maxSupply) === 0) {
        return
    }
    //
    console.info('token %s totalSupply has changed: %s -> %s, update it', ti.address, ti.maxSupply.toString(), totalSupply)
    ti.maxSupply = maxSupply
    tokenInfoCache.set(ti.address, ti)

    // update database
    if (totalSupply.length > 30) {
        // 科学计数法截断
        totalSupply = bnToString(maxSupply, 30)
    }
    await EthContract.updateContractInfoByAddress(ti.address, { maxSupply: totalSupply })
}

// 更新数据库中token 信息
async function updateTokenInfo(address: string) {
    // 查数据库
    if (reentryTokenInfo[address]) {
        return null
    }
    reentryTokenInfo[address] = 1

    getTokenInfo(address)
    delete reentryTokenInfo[address]
}

// 更新 token info 流程:
//    1. 是否在cache中, 如果在, 返回
//    2. 是否数据库中已经更新, 如果更新, 设置cahce, 返回
//    3. !!!(防止并发的情况)是否在cache中, 如果在, 返回
//    4. 设置cache, 状态为querying
//    5. 调用contract的方法, 查询token信息
//    6. 写入到数据库中
//    7. 设置cache状态为queryed
// name symbol precision totalsupply
// todo: totalsupply 不断发生变化的 token 合约
async function getTokenInfo(address: string): Promise<CacheTokenInfo> {
    let ti = tokenInfoCache.get(address)
    if (ti) {
        return ti
    }
    // 查数据库
    let found = true
    let info = await EthContract.getContractInfoByAddress(address)
    if (info === null) {
        // 不应该出现
        console.warn('not found contract by address ' + address)
        // return
        found = false
    }
    if (info?.contract_type === ContractTypeERC20) {
        // 已经是erc20
        ti = {
            address: info.address ?? '',
            status: 'queryed',
            decimals: info.precision ? +info.precision : -1,
            name: info.name ?? '',
            symbol: info.symbol ?? '',
            maxSupply: info.max_supply ? new BigNumber(info.max_supply) : new BigNumber(0),
        }
        tokenInfoCache.set(address, ti)
        return ti
    }

    ti = tokenInfoCache.get(address)
    if (ti) {
        return ti
    }
    ti = {
        address: address,
        status: 'querying',
        decimals: -1,
        name: '',
        symbol: '',
        maxSupply: new BigNumber(0),
    }
    tokenInfoCache.set(address, ti)
    let tokenCont = getTokenContractInst(address)
    let name = ''
    try {
        name = await tokenCont.methods.name().call()
    } catch (err) {}

    let symbol = ''
    try {
        symbol = await tokenCont.methods.symbol().call()
    } catch (err) {}

    // erc721 erc165 没有 decimals 方法
    let decimals = 0
    try {
        decimals = await tokenCont.methods.decimals().call()
    } catch (err) {}

    let totalsupply = 0
    try {
        totalsupply = await tokenCont.methods.totalSupply().call()
    } catch (err) {
        console.warn('get token totalsupply failed: ', err)
    }

    let maxSupply = new BigNumber(totalsupply)
    console.info('contract %s name: %s symbol: %s decimals: %s totalSupply: %s', address, name, symbol, decimals, maxSupply.toString())

    ti.name = name
    ti.symbol = symbol
    ti.decimals = +decimals
    ti.maxSupply = maxSupply
    ti.status = 'queryed'
    tokenInfoCache.set(address, ti)
    if (found) {
        ti.contractType = ContractTypeERC20
        await EthContract.updateContractInfoByAddress(address, ti)
    } // else todo update or ??

    return ti
}


async function batchGetInfo(provider: Web3, address: string) {
    let tokenCont = new provider.eth.Contract(Erc20ABI, address) // getTokenContractInst(address)
    let name = ''
        , symbol = ''
        , decimals = 0
        , totalSupply = '0'
        , arg = { from: '0x0000000000000000000000000000000000000000' }
    
    let batch = new provider.BatchRequest();
    await new Promise(function(resolve, reject) {

        batch.add(tokenCont.methods.decimals().call.request(arg, (err: any, data: any) => {
            if (err) { return }
            console.log('decimals:', data)
            decimals = +data
        }))

        batch.add(tokenCont.methods.name().call.request(arg, (err: any, data: any) => {
            if (err) {
                console.warn(err)
                return
            }
            name = data
        }))
        batch.add(tokenCont.methods.symbol().call.request(arg, (err: any, data: any) => {
            if (err) { console.warn(err) } else { symbol = data }
            
            resolve('')
        }))
        batch.add(tokenCont.methods.totalSupply().call.request(arg, (err: any, data: any) => {
            if (!err) {
                totalSupply = data
            }
        }))

        batch.execute()
    })
    console.log('token %s: name=%s symbol=%s decimals=%s totalSupply=%s', address, name, symbol, decimals, totalSupply)
}

;(async () => {
//     let testCache = async () => {
//         let addr = '0x4DEBbd1B723E6b71C4410FFc71465Ba3C09C5F33'
//         let bal = { balance: new BigNumber(1.2), height: 11548888 }
//         balanceCache.set(addr, bal)
//         let c = balanceCache.get(addr)
//         console.log('cache:', c)
//         let c1 = balanceCache.get('123')
//         console.log('cache 123:', c1)
//     }

//     testCache()
//     // testBalace()
    // let ti = await EthContract.getContractInfoByAddress('123456')
    // console.log('find contract by address', ti)
})()

export {
    getBalance,
    getTokenInfo,
    getCachedLatestBlockNumber,
    upsertAddressBalance,
    updateTokenInfo,
    batchGetInfo,
}
