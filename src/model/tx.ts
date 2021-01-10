import BigNumber from 'bignumber.js'
// import prisma from './db'

interface Tx {
    hash: string
    block: number
    pos: number
    status: number
    timestamp: number
    fee: BigNumber | string | number
    amount: BigNumber | string | number
    from: string
    to: string
}

export default Tx