import BigNumber from "bignumber.js"
import prisma from "../model/db"

import { Prisma } from '@prisma/client'
import { bnToString } from "./utils"

export const ContractTypeERC20   = 'ERC20'
export const ContractTypeERC721  = 'ERC721'
export const ContractTypeERC1155 = 'ERC1155'

class EthContract {
    id: number
    address: string
    creater: string
    txHash: string
    logo: string
    precision: number | null
    source: number              // 是否已经验证
    profiles: string
    prices: BigNumber | null
    site: string
    name: string
    symbol: string
    height: number             // 创建区块
    contractType: string
    content: string
    tags: string[]
    balance: BigNumber
    maxSupply: BigNumber
    // 统计数据
    holders: number
    transfers: number
    tabs: string[]           // 合约可以展现的二级列表

    constructor(address: string, creater: string, txHash: string, name: string, symbol: string, height: number, precision?: number) {
        this.id = 0
        this.address = address
        this.txHash = txHash
        this.name = name
        this.symbol = symbol
        this.height = height
        this.site = ''
        this.precision = precision ? precision : 0
        this.source = 0
        this.logo = ''
        this.profiles = '{}'
        this.prices = null
        this.creater = creater
        this.contractType = ''
        this.content = ''
        this.tags = []
        this.balance = new BigNumber(0)
        this.maxSupply = new BigNumber(0)
        this.holders = 0
        this.transfers = 0
        this.tabs = []
    }

    async create() {
        await prisma.eth_contract.create({
            data: {
                address: this.address,
                creater: this.creater,
                tx_hash: this.txHash,
                logo: this.logo,
                precision: this.precision,
                source: this.source,    // 是否已经验证
                profiles: this.profiles,
                price: this.prices? this.prices.toString() : '',
                site: this.site,
                name: this.name,
                symbol: this.symbol,
                height: this.height,  // 创建区块
                contract_type: this.contractType,
                content: this.content,
                tags: JSON.stringify(this.tags),
                balance: this.balance.toString(),
                max_supply: this.maxSupply.toString(),
                // 统计数据
                holders: this.holders,
                transfers: this.transfers,
                tabs: JSON.stringify(this.tabs) // 合约可以展现的二级列表
            }
        })
    }

    // 根据地址查找合约
    static async getContractInfoByAddress(address: string) {
        let rows = await prisma.eth_contract.findMany({
            where: { address: address}
        })
        if (rows.length === 0) {
            return null
        }
        if (rows.length > 1) {
            console.warn('found more than 1 Contract by address %s: %d', address, rows.length)
        }
        return rows[0]
    }

    static async updateContractInfoByAddress(address: string, args: any) {
        let data: Prisma.eth_contractUpdateManyMutationInput = {}

        if (args.name) { data.name = args.name }
        if (args.symbol) { data.symbol = args.symbol }
        if (args.decimals) { data.precision = args.decimals }
        if (args.maxSupply) {
            let ms = args.maxSupply.toString()
            if (ms.length > 30) {
                ms = bnToString(args.maxSupply, 30)
            }
            data.max_supply = ms
        }
        if (args.contractType) { data.contract_type = args.contractType}

        await prisma.eth_contract.updateMany({
            where: { address: address},
            data: data
        })
    }
}

// 批量入库 Contract
export async function batchCreateContract(params: Array<EthContract>) {
    if (params.length === 0) {
        return
    }

    let values = params.map(
        item => `('${item.address}', '${item.creater}', '${item.txHash}', '${item.logo}', '${item.precision}', '${item.source}', '${item.profiles}', '${item.prices ? item.prices.toString() : ""}', '${item.site}', '${item.name}', '${item.symbol}', '${item.height}', '${item.contractType}', '${item.content}', '${item.tags}', '${item.balance}', '${item.maxSupply}', '${item.holders}', '${item.transfers}', '${item.tabs}')`
      )
    let query = `insert into eth_contract (address, creater, tx_hash, logo, \`precision\`, source, profiles, price, site, name, symbol, height, contract_type, content, tags, balance, max_supply, holders, transfers, tabs) values ${values.join(',')}`

    await prisma.$executeRaw(query)
}

export async function cleanEthContractByHeight(height: number) {
    await prisma.$executeRaw(`delete from eth_contract where height = ${height}`)
}

export default EthContract
