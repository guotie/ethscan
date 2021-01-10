require('dotenv').config()

import provider from './Provider'
import { connectBrokers } from '../kafka/push'
import { EthBlock, handleBlock, cleanBlockDataByHeight, getLatestBlockNumber } from './Block'
import { deleteBlockScanStatus } from './Status'
import { sleep } from './utils'

async function doScanBlock(height: number, clean = true, checkMode = true) {
    try {
        if (clean) {
            await cleanBlockDataByHeight(height)
            await deleteBlockScanStatus(height)
        } else if (checkMode) {
            let b = await EthBlock.getDBBlockByHeight(height)
            if (b.length > 0) {
                console.info('block %d has scanned', height)
                return height  // Promise.resolve('')
            }    
        }
    } catch (err) {
        throw {err, height}
    }

    return handleBlock(provider, height)
}

// 
// start: 开始块
// end: 结束块
// token: 桶的大小, 最多多少个块并发扫描
// todo: 未知问题 有些块扫描成功但没有入库, 也没有报错, 怀疑与prisma有关
async function startScanBlock(start: number, end: number, token: number, clean = true) {
    let idles = token
        , failed: Array<number> = []
        , working: { [index: string]: number } = {}

    let scanner = (blockToScan: number, redo = false) => {
        working[blockToScan + ''] = new Date().getTime()
        idles --
        doScanBlock(blockToScan, redo)
            .then(blockNumber => {
                idles ++
                delete working[blockNumber + '']
                console.info('scan block %d done. idles: %d failed: %d', blockNumber, idles, failed.length)
            })
            .catch(resp => {
                console.log('failed:', resp)
                idles ++
                delete working[resp.height + '']
                console.warn('scan block %d failed. idles: %d err:', resp.height, idles, resp.err)
                failed.push(resp.height)
            })
    }

    if (!end) {
        end = await getLatestBlockNumber(provider)
        console.info('set end block to', end)
        // get latest height
        setInterval(async () => {
            try {
                let height = await getLatestBlockNumber(provider)
                if (height > end) {
                    end = height
                }
            } catch {
                // nothing
            }
        }, 15000) // 15 second
    }

    // todo fix
    // 有可能出现一些块不断的失败, 导致无法继续扫块（增加失败计数）
    for (let height = start; height <= end;) {
        if (idles > 0) {
            let blockToScan: number, redo = clean
            if (failed.length > 0) {
                // @ts-ignore
                blockToScan = failed.pop()
                // 失败的必须要清理
                redo = true
                console.log('re scan block', blockToScan)
            } else {
                blockToScan = height
                height ++
                console.log('do scan block', blockToScan)
            }

            scanner(blockToScan, redo)
        } else {
            // wait for
            await sleep(100)
        }
    }

    // todo fix!!!
    // 有可能出现failed队列中已经清空, 但正在执行的任务失败, 此时循环退出, 导致失败的任务无法继续执行
    // 
    if (failed.length > 0) {
        if (idles > 0) {
            let blockToScan: number
            // @ts-ignore
            blockToScan = failed.pop()
            console.log('re scan block', blockToScan)

            scanner(blockToScan)
        } else {
            // wait for
            await sleep(100)
        }
    }

    console.log('working queue:', working)
}

;(async () => {
    await connectBrokers()
    // let height = await getLatestBlockNumber()
    // console.log('height: ', height)
    let start = process.env.SCAN_START_BLOCK ? +process.env.SCAN_START_BLOCK : 0
        , end = process.env.SCAN_END_BLOCK ? +process.env.SCAN_END_BLOCK : 5000000
        , max = process.env.CONNCURRENT ? +process.env.CONNCURRENT : 100
    // doScanBlock(1216432)
    // cleanBlockDataByHeight(1216432)
    await startScanBlock(start, end, max, false)
    // let b1 = await EthBlock.getDBBlockByHeight(1)
    // let bn = await EthBlock.getDBBlockByHeight(6000004)
    // console.log('b1:', b1)
    // console.log('block 6000000:', bn)
    return
    // testTx()
    /*
    await sleep(1000)

    let block = await getBlock(11546811)
    let txs = block.transactions

    // // console.log(txs)
    // await getTx(txs[0])
    // await getTx(txs[1])
    console.log('web3 block:', block)
    let eb = toBlock(block)
    // await doTransactionList(provider, eb, txs)
    console.log('block:', eb)

    // make node do not exit to debug console args
    setInterval(() => {}, 1000)
    */
})()

export {
    getLatestBlockNumber,
    startScanBlock
}

