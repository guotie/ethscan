import prisma from '../model/db'

// UncleBlock 叔块信息
// 例如: 11546811 包含两个叔块
class UncleBlock {
    id: number
    height: number
    hash: string
    uncle: string
    timestamp: number

    constructor(height: number, hash: string, timestamp: number, uncle: string) {
        this.id = 0
        this.height = height
        this.hash = hash
        this.timestamp = timestamp
        this.uncle = uncle
    }

    async create() {
        let res = await prisma.eth_block_uncle.create({
            data: {
                height: this.height,
                hash: this.hash,
                uncle: this.uncle,
                timestamp: this.timestamp
            }
        })
    }
}

// 批量入库 UncleBlock
export async function batchCreateUncleBlock(uncles: Array<UncleBlock>) {
    if (uncles.length === 0) {
        return
    }

    let values = uncles.map(
        uncle => `('${uncle.height}', '${uncle.hash}', '${uncle.uncle}', '${uncle.timestamp}')`
      )
    let query = `insert into eth_block_uncle (height, hash, uncle, timestamp) values ${values.join(',')}`

    await prisma.$executeRaw(query)
}

// 删除叔块
export async function cleanUncleBlockByHeight(height: number) {
    await prisma.$executeRaw(`delete from eth_block_uncle where height = ${height}`)
}

export default UncleBlock
