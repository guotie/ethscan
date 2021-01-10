import BigNumber from 'bignumber.js'
import { BlockTransactionString } from 'web3-eth'
import Web3 from 'web3'
import dayjs from 'dayjs'

import {Block as BaseBlock } from '../model/block'
import prisma from '../model/db'
import UncleBlock, { batchCreateUncleBlock, cleanUncleBlockByHeight } from './UncleBlock'
import { batchCreateEthTx, cleanEthTxByHeight, doTransactionList } from './Tx'
import { batchCreateEthTxEvent, cleanEthTxEventsByHeight } from './Event'
import { BalanceEvent, updaterMinerBalance, pushEvents, IPushEvent } from './Push'
import { batchCreateContract, cleanEthContractByHeight } from './Contract'
// import { pushKafka } from '../kafka/push'
import { checkBlockScanStatus, setBlockScanstatusDone, BlockStatusDone } from './Status'

const BlockchainEthereum = 'Ethereum'
const BlockchainNetwork = 'Mainnet'
const BlockchainSymbol = 'ETH'

// 挖矿奖励, 不包括叔块
// 
function blockReward(height: number) {
    // https://media.consensys.net/the-thirdening-what-you-need-to-know-df96599ad857
    if (height >= 7280000) {
        return '2'
    }
    // The Byzantium hard fork is an update to ethereum’s blockchain that was implemented in October 2017 at block 4,370,000. It consisted of nine Ethereum Improvement Protocols (EIPs) designed to improve ethereum’s privacy, scalability and security attributes. (See also: Why The Ethereum DAO Is Revolutionary.) 
    if (height >= 4370000) {
        return '3'
    }
    return '5'
    // todo
    // https://zhuanlan.zhihu.com/p/28928827
    // 叔块奖励 = ( 叔块高度 + 8 - 包含叔块的区块的高度 ) * 普通区块奖励 / 8
}

class EthBlock implements BaseBlock {
    id: number
    // block chain
    blockchain: string
    network: string
    symbol: string
    // common field
    hash: string
    timestamp: number
    height: number
    minerBy: string
    totalTx: number
    blockSize: number
    parentHash?: string
    nextHash?: string
    merkleHash: string
    difficulty: number
    interval?: number
    fee: BigNumber
    // for ETH
    blockReward: string
    totalDiff: number
    uncleReward: string
    uncles: number
    gasUsed: number
    gasLimit: number
    shaUncles: string
    extraData: string
    txRootHash: string
    txInternals: number
    nonce: string
    price: string       // in usd
    // totalEvents: number

    constructor(b: BlockTransactionString) {
        this.id = 0
        this.blockchain = BlockchainEthereum
        this.network = BlockchainNetwork
        this.symbol = BlockchainSymbol

        this.hash = b.hash
        this.timestamp = +b.timestamp
        this.minerBy = b.miner
        this.height = b.number
        this.totalTx = b.transactions.length
        this.blockSize = b.size
        this.parentHash = b.parentHash
        this.nextHash = ''
        this.merkleHash = b.stateRoot // state hash
        this.difficulty = b.difficulty
        this.fee = new BigNumber(0)
        this.blockReward = blockReward(b.number)
        this.totalDiff = b.totalDifficulty
        this.uncleReward = '0'
        this.uncles = b.uncles.length
        this.gasUsed = b.gasUsed ?? 0
        this.gasLimit = b.gasLimit ?? 0
        this.shaUncles = b.sha3Uncles ?? ''
        this.extraData = b.extraData ?? ''
        this.txRootHash = b.transactionRoot ?? ''
        // this.totalEvents = b.totalEvents ?? 0
        this.txInternals = 0
        this.nonce = b.nonce
        this.price = ''
    }

    async createBlock() {
        // let block = this
        // await prisma.eth_block.create({
        //     data: {
        //         // id: block.id,
        //         hash: block.hash,
        //         ts: block.timestamp,
        //         height: block.height,
        //         miner_by: block.minerBy,
        //         total_tx: block.totalTx,
        //         block_size: block.blockSize,
        //         parent_hash: block.parentHash,
        //         next_hash: block.nextHash,
        //         merkle_hash: block.merkleHash,
        //         difficulty: block.difficulty + '',
        //         interval: 0,
        //         fee: block.fee.toString(),
        //         // for ETH
        //         block_reward: block.blockReward,
        //         total_diff: block.totalDiff + '',
        //         uncle_reward: block.uncleReward,
        //         gas_used: block.gasUsed,
        //         gas_limit: block.gasLimit,
        //         sha_uncles: block.shaUncles,
        //         extra_data: block.extraData,
        //         tx_root_hash: block.txRootHash,
        //         // total_events: block.totalEvents,
        //         tx_internals: block.txInternals ?? 0,
        //         nonce: block.nonce,
        //     }
        // })
        // 省去一次查询的时间
        // 直接用调用 create, prisma 会先insert, 然后 select
        let extraData = this.extraData
        if (extraData && extraData.length > 590) {
            extraData = extraData.slice(0, 590)
        }

        let val = `('${this.hash}',${this.height},${this.timestamp},'${this.minerBy}',${this.totalTx},${this.blockSize},'${this.parentHash}','${this.nextHash}','${this.merkleHash}',${this.difficulty},0,'${this.fee.toString()}','${this.nonce}','${this.blockReward}',${this.totalDiff},'${this.uncleReward}',${this.gasUsed},'${this.gasLimit}','${this.shaUncles}','${extraData}','${this.txRootHash}','${this.txInternals}')`
        await prisma.$executeRaw('INSERT INTO `clover`.`eth_block` (`hash`,`height`,`ts`,`miner_by`,`total_tx`,`block_size`,`parent_hash`,`next_hash`,`merkle_hash`,`difficulty`,`interval`,`fee`,`nonce`,`block_reward`,`total_diff`,`uncle_reward`,`gas_used`,`gas_limit`,`sha_uncles`,`extra_data`,`tx_root_hash`,`tx_internals`) VALUES ' + val)

        // return res
    }

    // 查找这个块是否已经扫描完成
    static async getDBBlockByHeight(height: number) {
        return await prisma.$queryRaw('SELECT id from `clover`.`eth_block` where height = ' + height)
    }

    // 处理叔块
    doUncleBlocks(uncles: Array<string>): Array<UncleBlock> {
        let unclesBlock: Array<UncleBlock> = []
        for (let i = 0; i < uncles.length; i ++) {
            let uncle = new UncleBlock(this.height, this.hash, this.timestamp, uncles[i])

            unclesBlock.push(uncle)
        }

        return unclesBlock
    }

    // // get block
    // static async getBlockBy({height, hash}: {height: number, hash: string}): Promise<any> {
    //     let block = await prisma.eth_block.findOne({
    //         where: {
    //             height: height
    //         }
    //     })
    //     return block
    // }
}

async function getBlock(provider: Web3, height: number) {
    let block = await provider.eth.getBlock(height)
    return block
}

async function getLatestBlockNumber(provider: Web3): Promise<number> {
    return await provider.eth.getBlockNumber()
}

// 处理 block
// 1. 余额的变动通知kafka, 由kafka的consumer程序处理
// 2. 这里入库的是block, tx, contract create, events
// 3. 可以触发余额变动的包括:
//    a. 产块地址eth更新
//    b. eth转账交易(from, to)
//    c. 合约transfer(from, to), burn(from), mint(from), send(from, to), transferFrom()事件
//    d. 合约调用, value 不为零的情况
//    e. todo swap withdraw eth, 没有事件, 需要 internal tx
//    e. 其他事件
async function handleBlock(provider: Web3, height: number) {
    try {
        let status = await checkBlockScanStatus(height)
        if (status) {
            // 已经扫描或正在扫描中
            console.warn('block %d is %s at %s', height, status.status, dayjs(status.ts).format('YYYY-MM-DD HH:mm:ss'))
            if (status === BlockStatusDone) {
                return Promise.resolve({err: 'block is scanned', height: height})
            }
        }
    } catch (err) {
        // still continue scan block
        console.warn('get block scan status failed:', err)
    }

    let block, eb, txList, events, contracts, balanceEvents
    try {
        block = await getBlock(provider, height)
        eb = new EthBlock(block)
        // console.log('block:', block)

        let result = await doTransactionList(provider, eb, block.transactions)
        txList        = result.txList
        events        = result.events
        contracts     = result.contracts
        balanceEvents = result.balanceEvents
    } catch (err) {
        return Promise.reject({err, height})
    }

    let uncles: Array<UncleBlock> = []
    if (block.uncles.length > 0) {
        uncles = eb.doUncleBlocks(block.uncles)
        // todo 叔块奖励 balance 更新事件
    }

    let kafkaEvents: Array<IPushEvent> = []
    kafkaEvents.push(updaterMinerBalance(block.miner))
    kafkaEvents.push(...balanceEvents)
    // await pushEvents(balanceEvents)

    return Promise.all([
        batchCreateEthTx(txList),       // 交易
        batchCreateEthTxEvent(events),  // tx logs
        batchCreateUncleBlock(uncles),  // 叔块
        batchCreateContract(contracts), // 合约创建
        eb.createBlock(),               // 块
    ]).then(async () => {
        // 推送需要新建或更新的账号资产信息
        pushEvents(kafkaEvents)
        // pushKafka('eth-block', {block: height})
        // 保存扫块状态 redis
        await setBlockScanstatusDone(height)
        return height
    })
    .catch(err => {
        console.warn('save block %d failed:', height, err)
        // todo 异常处理流程
        // 删除叔块
        throw {err, height}
    })
}

// 删除块, 用于重新扫块的准备
async function cleanBlockDataByHeight(height: number) {
    Promise.all([
        cleanBlockByHeight(height),
        cleanEthContractByHeight(height),
        cleanUncleBlockByHeight(height),
        cleanEthTxEventsByHeight(height),
        cleanEthTxByHeight(height)
    ])
}

// delete block in db
async function cleanBlockByHeight(height: number) {
    await prisma.$executeRaw(`delete from eth_block where height = ${height}`)
}

export {
    EthBlock,
    getBlock,
    handleBlock,
    getLatestBlockNumber,
    cleanBlockByHeight,
    cleanBlockDataByHeight,
}
