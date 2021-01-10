import redis from '../redis/client'

// 处理扫块状态
const BlockStatusScanning = 'scanning'
const BlockStatusFailed   = 'failed'
const BlockStatusDone     = 'done'

function blockKey(height: number): string {
    return 'eth:block:' + height.toString()
}

// 设置扫块状态
async function getBlockScanstatus(height: number, status: string) {
    await redis.set(blockKey(height), status)
}
// 设置扫块状态
async function setBlockScanstatus(height: number, status: string) {
    let ts = new Date().getTime()
    await redis.set(blockKey(height), JSON.stringify({ status, ts }))
}

// 设置扫块状态为完成
async function setBlockScanstatusDone(height: number) {
    await redis.set(blockKey(height), BlockStatusDone)
}

// 如果块正在扫或者已经扫描完成, 返回true
// 否则设置块的状态为scanning, 返回false
async function checkBlockScanStatus(height: number, ) {
    let res = await redis.get(blockKey(height))
    // console.info('block scan status:', status)
    if (res) {
        let status = JSON.parse(res)
        if (status.status === BlockStatusDone || status.status === BlockStatusScanning) {
            return status
        }
    }
    await setBlockScanstatus(height, BlockStatusScanning)
    return false
}

// 设置最新块高度
async function setLatestHeight(height: number) {
    await redis.set('eth:latest-height', height)
}

// deleteBlockScanStatus 删除扫块状态
async function deleteBlockScanStatus(height: number) {
    await redis.del(blockKey(height))
    // console.log('delete redis block status:', height)
}

export {
    BlockStatusScanning,
    BlockStatusFailed,
    BlockStatusDone,

    setLatestHeight,
    getBlockScanstatus,
    setBlockScanstatus,
    deleteBlockScanStatus,
    checkBlockScanStatus,
    setBlockScanstatusDone,
}
