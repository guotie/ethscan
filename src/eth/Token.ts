import BigNumber from "bignumber.js"
// import prisma from "../model/db"

class Token {
    id: number
    address: string
    creater: string
    txHash: string
    logo: string
    precision: number | null
    source: number    // 是否已经验证
    profiles: string
    prices: BigNumber | null
    site: string
    name: string
    symbol: string
    height: number  // 创建区块
    contractType: string
    content: string
    tag: string
    balance: BigNumber
    maxSupply: BigNumber
    // 统计数据
    holders: number
    transfers: number
    tabs: string[]

    constructor(address: string, creater: string, txHash: string, name: string, symbol: string, height: number, precision = 18) {
        this.id = 0
        this.address = address
        this.txHash = txHash
        this.name = name
        this.symbol = symbol
        this.height = height
        this.site = ''
        this.precision = precision
        this.source = 0
        this.logo = ''
        this.profiles = '{}'
        this.prices = null
        this.creater = creater
        this.contractType = ''
        this.content = ''
        this.tag = ''
        this.balance = new BigNumber(0)
        this.maxSupply = new BigNumber(0)
        this.holders = 0
        this.transfers = 0
        this.tabs = []
    }
}

export default Token
