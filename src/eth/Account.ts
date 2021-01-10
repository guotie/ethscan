import BigNumber from "bignumber.js"
import { Prisma } from '@prisma/client'

import prisma from '../model/db'
import { bnToString } from "./utils"

class Account {
    id: number
    address: string
    balance: BigNumber
    tokenName?: string
    tokenSymbol?: string
    tokenAddress?: string
    precision?: number
    lastUpdate?: number     // 最后一次更新的区号

    constructor(address: string, balance: BigNumber, tokenAddr = '') {
        this.id = 0
        this.address = address
        this.balance = balance
        this.tokenAddress = tokenAddr
        this.lastUpdate = 0
    }

    // 新建account
    async createAccount() {
        await prisma.eth_account.create({
            data: {
                address: this.address,
                balance: this.balance.toString(),
                token_address: this.tokenAddress,
                // token_name: this.tokenName,
                // token_symbol: this.tokenSymbol,
                // precision: this.precision,
                last_update: this.lastUpdate
            }
        })
    }

    // 更新余额
    static async upsertAccountBalance(address: string, tokenAddr: string, balance: BigNumber, blockNumber: number) {
        let data: Prisma.eth_accountUpdateInput = {}

        if (blockNumber) {
            data.last_update = blockNumber
        }
        let sbal = balance.toString()
        if (sbal.length > 30) {
            sbal = bnToString(balance)
        }
        data.balance = sbal
        let rows = await prisma.eth_account.updateMany({
            where: {
                address: address,
                token_address: tokenAddr
            },
            data: data
        })
        if (rows.count > 0) {
            return
        }
        // insert
        await prisma.$executeRaw(`insert into eth_account (address,token_address,balance,last_update) values ('${address}','${tokenAddr}','${sbal}',${blockNumber})`)
    }
}

export default Account
