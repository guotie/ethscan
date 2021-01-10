import prisma from '../model/db'

import './FlushRedis'

async function cleanup() {
    await prisma.$executeRaw('truncate `clover`.`eth_account`')
    await prisma.$executeRaw('truncate `clover`.`eth_tx`')
    await prisma.$executeRaw('truncate `clover`.`eth_tx_logs`')
    await prisma.$executeRaw('truncate `clover`.`eth_contract`')
    await prisma.$executeRaw('truncate `clover`.`eth_block_uncle`')
    await prisma.$executeRaw('truncate `clover`.`eth_block`')
    console.log('clean up successfully')
}

cleanup()
