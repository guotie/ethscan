import prisma from './db'
import { BigNumber } from 'bignumber.js'

interface Block {
    id?: number
    // block chain
    blockchain?: string
    network?: string
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
    fee: string | BigNumber
    // for BTC
    strippedSize?: number
    weight?: number
    version?: string
    nonce?: string
    bits?: string
    totalAmountIn?: string
    totalAmountOut?: string
    // for ETH
    blockReward?: string
    totalDiff?: number
    uncleReward?: string
    uncles?: number       // uncles 数量
    gasUsed?: number
    gasLimit?: number
    shaUncles?: string
    extraData?: string
    txRootHash?: string
    txInternals?: number // 内部合约交易
    totalEvents?: number
    // for DOT
    sessionId?: string
    logsCount?: number
}

async function createBlock(block: Block) {
    let res = await prisma.block.create({
        data: {
            // id: block.id,
            hash: block.hash,
            ts: block.timestamp,
            height: block.height,
            miner_by: block.minerBy,
            total_tx: block.totalTx,
            block_size: block.blockSize,
            parent_hash: block.parentHash,
            next_hash: block.nextHash,
            merkle_hash: block.merkleHash,
            difficulty: block.difficulty,
            interval: 0,
            fee: block.fee ? '' : block.fee,
            // for BTC
            stripped_size: block.strippedSize,
            weight: block.weight,
            version: block.version,
            nonce: block.nonce,
            bits: block.bits,
            total_amount_in: block.totalAmountIn,
            total_amount_out: block.totalAmountOut,
            // for ETH
            block_reward: block.blockReward,
            total_diff: block.totalDiff + '',
            uncle_reward: block.uncleReward,
            gas_used: block.gasUsed,
            gas_limit: block.gasLimit,
            sha_uncles: block.shaUncles,
            extra_data: block.extraData,
            tx_root_hash: block.txRootHash,
            total_events: block.totalEvents,
            // for DOT
            session_id: block.sessionId,
            logs_count: block.logsCount,
        }
    })
    return res
}

// ;(async () => {
//     createBlock({id:1, hash: '0x12340', timestamp: new Date().getTime(), height: 1, minerBy: '12345'})
// })();

export {
    Block,
    createBlock
}

