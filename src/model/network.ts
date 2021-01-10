import prisma from './db'


interface Network {
    id?: number
    network: string
    symbol: string
    blockchain: string
    subNetwork?: string
    chainId?: string
    precision: number
    metadata?: string
}

async function createNetwork(params: Network) {
    let res = await prisma.network.create({
        data: {
            // id: 0,
            network: params.network,
            blockchain: params.blockchain,
            sub_network: params.subNetwork,
            chain_id: params.chainId,
            metadata: params.metadata,
            precision: params.precision,
            symbol: params.symbol,
        }
    })
    return res
}

async function getNetworkBy({id, network, symbol, blockchain, subNetwork, chainId}: {
    id?: number,
    network?: string
    symbol?: string
    blockchain?: string
    subNetwork?: string
    chainId?: string
}) {
    let res = await prisma.network.findFirst()
    return res
}

/*
;(async () => {
    createNetwork({network:'mainnet', blockchain:'bitcoin', symbol: 'BTC', precision: 8})
    createNetwork({network:'mainnet', blockchain:'ethereum', symbol: 'ETH', precision: 18, chainId: '1'})
    createNetwork({network:'mainnet', blockchain:'polkadot', symbol: 'DOT', precision: 8})
    createNetwork({network:'mainnet', blockchain:'polkadot', symbol: 'CLV', precision: 8})
})();
*/

export {
    createNetwork,
    getNetworkBy
}